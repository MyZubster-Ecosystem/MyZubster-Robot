// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title RobotEscrow
 * @author MyZubster Ecosystem
 * @notice Escrow 2-di-3 per lavori robot: Cliente + Robot + AI Arbitro.
 *
 * @dev Modello di fiducia:
 *  1. Il Cliente crea il job e deposita i fondi, che restano bloccati nello smart contract.
 *  2. Il Robot esegue il lavoro.
 *  3. Servono 2 firme su 3 (Cliente, Robot, AI Arbitro) per sbloccare il pagamento al Robot.
 *  4. In caso di disputa, l'AI Arbitro decide la direzione (rilascio al Robot o rimborso al Cliente).
 *  5. Se il lavoro non completa entro la scadenza, il Cliente puo' chiedere il rimborso.
 *
 *  Il contratto e' pensato per essere deployato su Polygon/Base e pilotato da un
 *  API Gateway (vedi docs/escrow-api.md). L'AI Arbitro e' un bot off-chain che
 *  esamina l'evidenza del lavoro e chiama resolveDispute(); qui viene fornita anche
 *  una simulazione deterministica per il testing (simulateArbiterVerdict).
 */
contract RobotEscrow {
    // ------------------------------------------------------------------
    // Tipi
    // ------------------------------------------------------------------
    enum Status {
        AwaitingFunding, // job creato, fondi non ancora depositati
        Funded,          // fondi bloccati, in attesa che il Robot inizi
        InProgress,      // Robot al lavoro
        Completed,       // pagamento rilasciato al Robot
        Disputed,        // disputa aperta
        Refunded         // fondi rimborsati al Cliente
    }

    struct Job {
        address client;
        address robot;
        address arbiter;     // AI Arbitro (simulato off-chain)
        uint256 amount;      // fondi bloccati (wei)
        Status status;
        uint256 deadline;    // scadenza per il completamento (timestamp)
        bool clientApproved; // firma del Cliente
        bool robotApproved;  // firma del Robot
        bool arbiterApproved; // firma dell'AI Arbitro
    }

    // ------------------------------------------------------------------
    // Storage
    // ------------------------------------------------------------------
    uint256 private _nextJobId;

    mapping(bytes32 => Job) private _jobs;
    bytes32[] private _jobList;

    // ------------------------------------------------------------------
    // Eventi
    // ------------------------------------------------------------------
    event JobCreated(bytes32 indexed jobId, address indexed client, address indexed robot, address arbiter, uint256 amount);
    event Funded(bytes32 indexed jobId, uint256 amount);
    event WorkStarted(bytes32 indexed jobId);
    event Approved(bytes32 indexed jobId, address indexed by);
    event Released(bytes32 indexed jobId, address indexed robot, uint256 amount);
    event Disputed(bytes32 indexed jobId, address indexed by);
    event Resolved(bytes32 indexed jobId, bool releaseToRobot, uint256 amount);
    event Refunded(bytes32 indexed jobId, address indexed client, uint256 amount);

    // ------------------------------------------------------------------
    // Errori
    // ------------------------------------------------------------------
    error Unauthorized();
    error ZeroAddress();
    error InvalidDuration();
    error InvalidStatus(Status current);
    error InsufficientFunds();
    error DeadlineNotPassed();
    error JobNotFound();

    // ------------------------------------------------------------------
    // Modifiers
    // ------------------------------------------------------------------
    modifier onlyParty(bytes32 jobId) {
        Job storage j = _jobs[jobId];
        if (msg.sender != j.client && msg.sender != j.robot && msg.sender != j.arbiter) {
            revert Unauthorized();
        }
        _;
    }

    modifier onlyArbiter(bytes32 jobId) {
        if (msg.sender != _jobs[jobId].arbiter) revert Unauthorized();
        _;
    }

    // ------------------------------------------------------------------
    // View
    // ------------------------------------------------------------------
    function getJob(bytes32 jobId)
        external
        view
        returns (
            address client,
            address robot,
            address arbiter,
            uint256 amount,
            Status status,
            uint256 deadline,
            bool clientApproved,
            bool robotApproved,
            bool arbiterApproved
        )
    {
        Job storage j = _jobs[jobId];
        if (j.client == address(0)) revert JobNotFound();
        return (j.client, j.robot, j.arbiter, j.amount, j.status, j.deadline, j.clientApproved, j.robotApproved, j.arbiterApproved);
    }

    function jobCount() external view returns (uint256) {
        return _jobList.length;
    }

    function jobAt(uint256 index) external view returns (bytes32) {
        return _jobList[index];
    }

    // ------------------------------------------------------------------
    // Flusso principale
    // ------------------------------------------------------------------

    /// @dev Il Cliente crea un nuovo job di escrow. Il chiamante diventa il Cliente.
    /// @param robot Indirizzo del Robot esecutore.
    /// @param arbiter Indirizzo dell'AI Arbitro.
    /// @param durationSeconds Durata massima del lavoro (per il rimborso su timeout).
    function createJob(address robot, address arbiter, uint256 durationSeconds) external returns (bytes32 jobId) {
        if (robot == address(0) || arbiter == address(0)) revert ZeroAddress();
        if (durationSeconds == 0) revert InvalidDuration();

        jobId = keccak256(abi.encodePacked(msg.sender, robot, arbiter, _nextJobId++));

        Job storage j = _jobs[jobId];
        j.client = msg.sender;
        j.robot = robot;
        j.arbiter = arbiter;
        j.status = Status.AwaitingFunding;
        j.deadline = block.timestamp + durationSeconds;

        _jobList.push(jobId);
        emit JobCreated(jobId, msg.sender, robot, arbiter, 0);
    }

    /// @dev Il Cliente deposita i fondi (payable).
    function fund(bytes32 jobId) external payable {
        Job storage j = _jobs[jobId];
        if (j.client == address(0)) revert JobNotFound();
        if (msg.sender != j.client) revert Unauthorized();
        if (j.status != Status.AwaitingFunding) revert InvalidStatus(j.status);
        if (msg.value == 0) revert InsufficientFunds();

        j.amount += msg.value;
        j.status = Status.Funded;
        emit Funded(jobId, msg.value);
    }

    /// @dev Il Robot dichiara l'inizio del lavoro.
    function startWork(bytes32 jobId) external {
        Job storage j = _jobs[jobId];
        if (j.client == address(0)) revert JobNotFound();
        if (msg.sender != j.robot) revert Unauthorized();
        if (j.status != Status.Funded) revert InvalidStatus(j.status);

        j.status = Status.InProgress;
        emit WorkStarted(jobId);
    }

    /// @dev Una delle 3 parti firma il completamento. Con 2 firme su 3 i fondi
    ///      vengono rilasciati al Robot automaticamente.
    function approve(bytes32 jobId) external onlyParty(jobId) {
        Job storage j = _jobs[jobId];
        if (j.status != Status.Funded && j.status != Status.InProgress) revert InvalidStatus(j.status);

        if (msg.sender == j.client) {
            j.clientApproved = true;
        } else if (msg.sender == j.robot) {
            j.robotApproved = true;
        } else {
            j.arbiterApproved = true;
        }

        emit Approved(jobId, msg.sender);

        uint256 sigs = _signatureCount(j);
        if (sigs >= 2) {
            _releaseToRobot(jobId);
        }
    }

    /// @dev Apre una disputa. Solo una delle 3 parti.
    function dispute(bytes32 jobId) external onlyParty(jobId) {
        Job storage j = _jobs[jobId];
        if (j.status != Status.Funded && j.status != Status.InProgress) revert InvalidStatus(j.status);

        j.status = Status.Disputed;
        emit Disputed(jobId, msg.sender);
    }

    /// @dev L'AI Arbitro risolve la disputa (ruolo di spareggio).
    /// @param releaseToRobot true = paga il Robot; false = rimborsa il Cliente.
    function resolveDispute(bytes32 jobId, bool releaseToRobot) external onlyArbiter(jobId) {
        Job storage j = _jobs[jobId];
        if (j.status != Status.Disputed) revert InvalidStatus(j.status);

        j.arbiterApproved = true;
        uint256 amount = j.amount;

        if (releaseToRobot) {
            _releaseToRobot(jobId);
        } else {
            _refundToClient(jobId);
        }
        emit Resolved(jobId, releaseToRobot, amount);
    }

    /// @dev Il Cliente chiede il rimborso se il lavoro non e' stato completato entro la scadenza.
    function refund(bytes32 jobId) external {
        Job storage j = _jobs[jobId];
        if (j.client == address(0)) revert JobNotFound();
        if (msg.sender != j.client) revert Unauthorized();
        if (j.status != Status.Funded && j.status != Status.InProgress) revert InvalidStatus(j.status);
        if (block.timestamp < j.deadline) revert DeadlineNotPassed();

        _refundToClient(jobId);
    }

    // ------------------------------------------------------------------
    // AI Arbitro simulato
    // ------------------------------------------------------------------

    /// @dev Simulazione deterministica del verdetto dell'AI Arbitro (solo testing/demo).
    ///      In produzione l'arbitro e' un bot off-chain che valuta l'evidenza e chiama
    ///      resolveDispute() con la decisione reale.
    function simulateArbiterVerdict(bytes32 jobId, uint256 nonce) external pure returns (bool) {
        return (uint256(keccak256(abi.encodePacked(jobId, nonce))) % 2) == 0;
    }

    // ------------------------------------------------------------------
    // Interni
    // ------------------------------------------------------------------

    function _signatureCount(Job storage j) internal view returns (uint256) {
        uint256 n = 0;
        if (j.clientApproved) n++;
        if (j.robotApproved) n++;
        if (j.arbiterApproved) n++;
        return n;
    }

    function _releaseToRobot(bytes32 jobId) internal {
        Job storage j = _jobs[jobId];
        j.status = Status.Completed;
        uint256 amount = j.amount;
        j.amount = 0;

        (bool ok, ) = j.robot.call{value: amount}("");
        require(ok, "RobotEscrow: transfer to robot failed");

        emit Released(jobId, j.robot, amount);
    }

    function _refundToClient(bytes32 jobId) internal {
        Job storage j = _jobs[jobId];
        j.status = Status.Refunded;
        uint256 amount = j.amount;
        j.amount = 0;

        (bool ok, ) = j.client.call{value: amount}("");
        require(ok, "RobotEscrow: refund to client failed");

        emit Refunded(jobId, j.client, amount);
    }
}
