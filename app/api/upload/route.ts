import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { uploadImage } from "@/lib/cloudinary";

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (userId === null) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("image");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Hanya file gambar yang diizinkan" },
        { status: 400 }
      );
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Ukuran gambar maksimal 5MB" },
        { status: 400 }
      );
    }

    const url = await uploadImage(file);
    return NextResponse.json({ url });
  } catch (error) {
    console.error("upload error", error);
    return NextResponse.json(
      { error: "Gagal mengunggah gambar" },
      { status: 500 }
    );
  }
}
