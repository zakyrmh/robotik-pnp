import { Timestamp } from "firebase/firestore";

function formatDate(value: string | Timestamp | null | undefined): string {
  if (!value) return "";

  if (value instanceof Timestamp) {
    return value.toDate().toISOString().split("T")[0];
  }

  const date = new Date(value);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split("T")[0];
  }

  return "";
}

export default formatDate;