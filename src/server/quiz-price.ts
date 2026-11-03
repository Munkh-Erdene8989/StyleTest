import { storedQuizPrice } from "@/domain/money";
import { getStore } from "./store";

export async function currentQuizPrice() {
  const site = await getStore().getSiteConfig();
  return storedQuizPrice(site.quizPriceMnt);
}
