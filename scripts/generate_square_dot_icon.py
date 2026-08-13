import struct
import zlib
import os

def create_png(width, height, background_rgb, dot_rgb, dot_radius):
    # RGB pixels
    pixels = []
    center_x = width / 2.0
    center_y = height / 2.0

    for y in range(height):
        row = [0] # Filter type 0 (None)
        for x in range(width):
            dist = ((x + 0.5 - center_x) ** 2 + (y + 0.5 - center_y) ** 2) ** 0.5
            if dist <= dot_radius:
                r, g, b = dot_rgb
            else:
                r, g, b = background_rgb
            row.extend([r, g, b])
        pixels.append(bytes(row))

    raw_data = b"".join(pixels)
    compressed_data = zlib.compress(raw_data)

    def make_chunk(chunk_type, data):
        length = len(data)
        checksum = zlib.crc32(chunk_type + data) & 0xffffffff
        return struct.pack(">I", length) + chunk_type + data + struct.pack(">I", checksum)

    header = b"\x89PNG\r\n\x1a\n"
    ihdr_data = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    ihdr = make_chunk(b"IHDR", ihdr_data)
    idat = make_chunk(b"IDAT", compressed_data)
    iend = make_chunk(b"IEND", b"")

    return header + ihdr + idat + iend

os.makedirs("public/icons", exist_ok=True)

# Green square: #10B981 (RGB 16, 185, 129), Black dot: #000000 (RGB 0, 0, 0)
green_rgb = (16, 185, 129)
black_rgb = (0, 0, 0)

with open("public/icons/icon-16.png", "wb") as f:
    f.write(create_png(16, 16, green_rgb, black_rgb, 3.0))

with open("public/icons/icon-48.png", "wb") as f:
    f.write(create_png(48, 48, green_rgb, black_rgb, 9.0))

with open("public/icons/icon-128.png", "wb") as f:
    f.write(create_png(128, 128, green_rgb, black_rgb, 24.0))

print("Green square with black dot icons generated successfully.")
