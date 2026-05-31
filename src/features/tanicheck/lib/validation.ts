import { MAX_FILE_SIZE } from "../constants";

export function validateImageFile(file: File) {
  if (!file.type.startsWith("image/")) {
    return "File bukan gambar. Pilih foto tomat dengan format gambar.";
  }
  if (file.size > MAX_FILE_SIZE) {
    return "Ukuran foto terlalu besar. Gunakan gambar maksimal 8 MB.";
  }
  return null;
}

export function validateInputs(marketPrice: string, quantityKg: string, marketLocation: string) {
  const price = Number(marketPrice);
  const quantity = Number(quantityKg);

  if (!marketPrice.trim() || Number.isNaN(price) || price <= 0) {
    return "Harga pasar hari ini harus diisi dengan angka lebih dari 0.";
  }
  if (price > 1000000) {
    return "Harga pasar terlalu besar. Periksa kembali harga per kilogram.";
  }
  if (!quantityKg.trim() || Number.isNaN(quantity) || quantity <= 0) {
    return "Estimasi jumlah beli harus diisi dengan angka lebih dari 0 kg.";
  }
  if (quantity > 100000) {
    return "Jumlah beli terlalu besar. Periksa kembali estimasi kilogram.";
  }
  if (!marketLocation.trim()) {
    return "Lokasi atau pasar perlu diisi sebagai konteks harga.";
  }
  return null;
}
