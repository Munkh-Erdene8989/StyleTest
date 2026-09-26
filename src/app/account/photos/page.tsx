import { DeletePhotosButton } from "@/components/account-actions";

export default function PhotosPage() {
  return (
    <main className="grid gap-4">
      <h1>Эх зураг</h1>
      <p>Эх зураг устгахад нүүр, бүтэн биеийн оруулсан файл устана. Худалдаж авсан тайлан болон дүрслэл үлдэнэ.</p>
      <p>Бүртгэл устгах үед хариулт, тайлан, дүрслэл, эрх хамт устана. Санхүүгийн захиалга үлдэнэ.</p>
      <DeletePhotosButton />
    </main>
  );
}
