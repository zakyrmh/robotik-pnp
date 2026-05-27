/**
 * Simple EXIF parser to extract DateTimeOriginal from a JPEG Buffer.
 * Supports both Little Endian (II) and Big Endian (MM) TIFF headers.
 */
export function extractExifDateTime(buffer: Buffer): Date | null {
  try {
    // Check if buffer is a valid JPEG
    if (buffer.length < 4 || buffer[0] !== 0xFF || buffer[1] !== 0xD8) {
      return null;
    }

    let offset = 2;
    let app1Offset = -1;

    // Scan for APP1 marker (0xFFE1)
    while (offset < buffer.length - 4) {
      const marker = buffer.readUInt16BE(offset);
      const length = buffer.readUInt16BE(offset + 2);
      if (marker === 0xFFE1) {
        app1Offset = offset;
        break;
      }
      // If we see SOS (Start of Scan 0xFFDA) or EOI (End of Image 0xFFD9), stop scanning
      if (marker === 0xFFDA || marker === 0xFFD9) {
        break;
      }
      offset += 2 + length;
    }

    if (app1Offset === -1) {
      return null;
    }

    // Check for "Exif\0\0" header
    const exifHeaderOffset = app1Offset + 4;
    const headerStr = buffer.toString("utf8", exifHeaderOffset, exifHeaderOffset + 4);
    if (headerStr !== "Exif") {
      return null;
    }

    // TIFF Header starts at app1Offset + 10
    const tiffHeaderOffset = app1Offset + 10;
    const byteOrderMarker = buffer.toString("utf8", tiffHeaderOffset, tiffHeaderOffset + 2);
    const isLittleEndian = byteOrderMarker === "II";
    if (!isLittleEndian && byteOrderMarker !== "MM") {
      return null;
    }

    const readUInt16 = (off: number) =>
      isLittleEndian ? buffer.readUInt16LE(off) : buffer.readUInt16BE(off);
    const readUInt32 = (off: number) =>
      isLittleEndian ? buffer.readUInt32LE(off) : buffer.readUInt32BE(off);

    const magic = readUInt16(tiffHeaderOffset + 2);
    if (magic !== 0x002a) {
      return null;
    }

    const firstIfdOffset = readUInt32(tiffHeaderOffset + 4);
    const ifdOffset = tiffHeaderOffset + firstIfdOffset;

    // Find Exif IFD Pointer (0x8769)
    let exifIfdOffset = -1;
    if (ifdOffset < buffer.length - 2) {
      const entryCount = readUInt16(ifdOffset);
      let entryOffset = ifdOffset + 2;
      for (let i = 0; i < entryCount; i++) {
        if (entryOffset + 12 > buffer.length) break;
        const tag = readUInt16(entryOffset);
        if (tag === 0x8769) {
          exifIfdOffset = tiffHeaderOffset + readUInt32(entryOffset + 8);
          break;
        }
        entryOffset += 12;
      }
    }

    if (exifIfdOffset === -1) {
      return null;
    }

    // Search for DateTimeOriginal (0x9003) inside Exif IFD
    if (exifIfdOffset < buffer.length - 2) {
      const entryCount = readUInt16(exifIfdOffset);
      let entryOffset = exifIfdOffset + 2;
      for (let i = 0; i < entryCount; i++) {
        if (entryOffset + 12 > buffer.length) break;
        const tag = readUInt16(entryOffset);
        if (tag === 0x9003) {
          const count = readUInt32(entryOffset + 4);
          const valueOffset = readUInt32(entryOffset + 8);
          const dataOffset = tiffHeaderOffset + valueOffset;
          if (dataOffset + count <= buffer.length) {
            const dateStr = buffer.toString("utf8", dataOffset, dataOffset + count - 1); // Exclude null terminator
            // Format is "YYYY:MM:DD HH:MM:SS"
            const parts = dateStr.split(" ");
            if (parts.length >= 1) {
              const dateParts = parts[0].split(":");
              if (dateParts.length === 3) {
                const year = parseInt(dateParts[0], 10);
                const month = parseInt(dateParts[1], 10) - 1; // 0-indexed
                const day = parseInt(dateParts[2], 10);
                let hours = 0, minutes = 0, seconds = 0;
                if (parts[1]) {
                  const timeParts = parts[1].split(":");
                  if (timeParts.length === 3) {
                    hours = parseInt(timeParts[0], 10);
                    minutes = parseInt(timeParts[1], 10);
                    seconds = parseInt(timeParts[2], 10);
                  }
                }
                return new Date(year, month, day, hours, minutes, seconds);
              }
            }
          }
        }
        entryOffset += 12;
      }
    }
  } catch (error) {
    console.error("Error parsing EXIF DateTimeOriginal:", error);
  }
  return null;
}
