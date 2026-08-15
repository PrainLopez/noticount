import { fetchJson, postJson } from "@/src/api/fetch-json";

type AccountRecordInsertData = {
  amount: number;
  currency_type: string;
  note: string;
  record_type: string;
};

export async function insertAccountRecord(input: AccountRecordInsertData): Promise<void> {
  await fetchJson("/api/records", postJson(input));
}
