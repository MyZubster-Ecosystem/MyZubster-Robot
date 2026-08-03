# Clonable Firmware Spec - MyZubster Self-Replication Kit (issue #73)

> Scheda madre ESP32 con firmware clonabile. This file pins down what "clonable
> firmware" means in this kit so the `firmwareCloneSpec` helper is auditable.
> IMPORTANT: this is a documentation-only specification. There is no real
> firmware signing, no private key, and no network flash operation anywhere in
> this kit.

## Data model

A clonable-firmware manifest describes one or more firmware *images* a parent
robot would copy onto a child ESP32:

```
manifest = {
  parentVersion: "0.4.2",
  targetBoard: "ESP32-DevKit",
  images: [
    { name: "myzubster-fw", version: "0.4.2", size: 131072, targetSlot: "main" },
    { name: "bootstrap",    version: "1.0.0", size: 4096,   targetSlot: "boot" }
  ]
}
```

## Reference checksum (NOT cryptographic)

`firmwareCloneSpec` derives a **reference checksum** for each image - a plain
djb2 string fold of the image name + version + size. It is *not* a cryptographic
hash, *not* a signed digest, and uses *no key material*. Its only purpose is to
make the manifest reproducible and auditable: the same image identity always
produces the same `ref-XXXXXXXX` value, so a child robot can confirm its flashed
image matches the parent manifest with no secrets exchanged.

## Clone payload

The thing a child robot "receives" is a structured description, not real bytes:

```
clonePayload = {
  parentVersion: "0.4.2",
  targetBoard: "ESP32-DevKit",
  imageCount: 2,
  totalSizeBytes: 135168,
  flashSequence: [ { image: "myzubster-fw", slot: "main", order: 1 },
                    { image: "bootstrap",    slot: "boot", order: 2 } ]
}
```

In a real deployment the operator would flash the matching binaries over USB-C
using their own toolchain. This kit only models the manifest and the flash plan;
it ships **no binary image** and **no signing key**.

## Safety scope

- No private key, no signature, no signed digest.
- No mainnet radio, no network flash, no contract deployment.
- The ESP32 runs deterministic firmware helpers only (see `replication.js`).
- This matches the safe-harbor note: documentation + protocol spec, no crypto.
