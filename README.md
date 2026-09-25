# StyleAI

Монгол хэл дээрх тест, тайлан, стайлын платформ. Нэр нь `NEXT_PUBLIC_APP_NAME` болон админы тохиргооноос солигдоно.

## Ажиллуулах

```bash
cp .env.example .env.local
npm install
npm test
npm run dev
```

`.env.local` дээрх хоосон утгыг бөглөнө. Admin эрх байхгүй үед өгөгдөл санах ойд хадгалагдана. `QPAY_SIMULATE=true` үед production QPay хаяг дээр туршилтын төлбөр ажиллахгүй.

Firebase, Resend, QPay, OpenAI түлхүүрээ бөглөсний дараа `DATA_DRIVER=firestore` гэж тохируулна. Урт generation ажил `WORKER_URL` руу Cloud Tasks-аар гарна.
