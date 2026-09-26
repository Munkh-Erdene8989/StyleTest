import Link from "next/link";

export default function NotFound() {
  return (
    <main>
      <h1>Хуудас олдсонгүй</h1>
      <p>Холбоосоо шалгаад нүүр хуудас руу буцна уу.</p>
      <Link className="btn" href="/">
        Нүүр хуудас
      </Link>
    </main>
  );
}
