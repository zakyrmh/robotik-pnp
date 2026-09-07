# React 19 Reference & Design Patterns Guide

Panduan teknis mendalam mengenai **React 19 (v19.2)** yang mencakup Hooks baru, fitur konkuensi (Concurrent Features), penanganan form & Server Actions, serta _design patterns_ modern untuk aplikasi skala besar.

---

## 1. Ikhtisar Hooks Baru di React 19

React 19 memperkenalkan beberapa Hooks resmi untuk mempermudah manajemen _asynchronous state_, _form handling_, dan _optimistic UI updates_.

| Hook Name        | Kategori / Fungsi                   | Kasus Penggunaan Utama                                                                    |
| :--------------- | :---------------------------------- | :---------------------------------------------------------------------------------------- |
| `useActionState` | Form & Action State Management      | Mengelola state dari async action, status `pending`, dan pesan return error/success.      |
| `useFormStatus`  | Form Subtree Status Context         | Mengakses status pending parent `<form>` tanpa _prop-drilling_ ke komponen anak.          |
| `useOptimistic`  | Optimistic Data Updates             | Menampilkan perubahan UI secara instan sebelum respon server selesai.                     |
| `use`            | Async Resource & Context Unwrapping | Membaca nilai `Promise` atau `Context` secara fleksibel (bisa di dalam conditional/loop). |

---

## 2. Eksplorasi & Contoh Implementasi Hooks

### 2.1. `useActionState`

`useActionState` menerima fungsi action (async) dan _initial state_, lalu mengembalikan state terbaru, fungsi wrapper action, serta flag `isPending`.

```tsx
"use client";

import { useActionState } from "react";

type State = {
  message: string | null;
  error: string | null;
};

async function updateNameAction(
  previousState: State,
  formData: FormData,
): Promise<State> {
  const name = formData.get("name") as string;

  if (!name || name.length < 3) {
    return { message: null, error: "Nama minimal 3 karakter." };
  }

  // Simulasi async request / Server Action
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return { message: `Nama berhasil diubah menjadi ${name}`, error: null };
}

export function UpdateNameForm() {
  const [state, formAction, isPending] = useActionState(updateNameAction, {
    message: null,
    error: null,
  });

  return (
    <form action={formAction} className="space-y-4">
      <input
        type="text"
        name="name"
        placeholder="Masukkan nama baru"
        className="border p-2 rounded"
        disabled={isPending}
      />

      <button
        type="submit"
        disabled={isPending}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {isPending ? "Menyimpan..." : "Simpan"}
      </button>

      {state.error && <p className="text-red-500">{state.error}</p>}
      {state.message && <p className="text-green-500">{state.message}</p>}
    </form>
  );
}
```

---

### 2.2. `useFormStatus`

Hook `useFormStatus` membaca status submit dari parent `<form>` tempat komponen tersebut diletakkan.

```tsx
"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton() {
  // Hanya bekerja jika komponen ini berada di dalam <form>
  const { pending, data, method, action } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-indigo-600 text-white px-4 py-2 rounded disabled:opacity-50"
    >
      {pending ? "Mengirim Data..." : "Kirim"}
    </button>
  );
}
```

---

### 2.3. `useOptimistic`

Meningkatkan _User Experience_ dengan langsung merender UI baru selagi proses mutasi data asynchronous di latar belakang sedang berjalan.

```tsx
"use client";

import { useOptimistic, useState, useTransition } from "react";

type Message = { id: string; text: string; sending?: boolean };

export function ChatThread({
  initialMessages,
}: {
  initialMessages: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [, startTransition] = useTransition();

  const [optimisticMessages, addOptimisticMessage] = useOptimistic(
    messages,
    (currentMessages, newText: string) => [
      ...currentMessages,
      { id: Date.now().toString(), text: newText, sending: true },
    ],
  );

  async function sendMessageAction(formData: FormData) {
    const text = formData.get("message") as string;
    if (!text) return;

    // 1. Tampilkan UI secara optimis
    addOptimisticMessage(text);

    // 2. Eksekusi request aktual
    startTransition(async () => {
      const sentMessage = await fakeApiSendMessage(text); // Async Server call
      setMessages((prev) => [...prev, sentMessage]);
    });
  }

  return (
    <div>
      <ul className="space-y-2 mb-4">
        {optimisticMessages.map((m) => (
          <li key={m.id} className={m.sending ? "opacity-50 italic" : ""}>
            {m.text} {m.sending && "(Mengirim...)"}
          </li>
        ))}
      </ul>

      <form action={sendMessageAction} className="flex gap-2">
        <input name="message" className="border p-2 rounded flex-1" />
        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Kirim
        </button>
      </form>
    </div>
  );
}

async function fakeApiSendMessage(text: string): Promise<Message> {
  await new Promise((res) => setTimeout(res, 1200));
  return { id: Date.now().toString(), text };
}
```

---

### 2.4. `use` API

`use` adalah API React baru yang dapat membaca nilai dari Promise atau React Context secara fleksibel.

#### A. Unwrapping Promise di Server / Client Component dengan `<Suspense>`

```tsx
"use client";

import { use, Suspense } from "react";

type User = { name: string; email: string };

function UserProfileCard({ userPromise }: { userPromise: Promise<User> }) {
  // React akan meng-suspend render hingga Promise ter-resolve
  const user = use(userPromise);

  return (
    <div className="border p-4 rounded shadow">
      <h3 className="font-bold">{user.name}</h3>
      <p className="text-gray-600">{user.email}</p>
    </div>
  );
}

export function UserDashboard({ userPromise }: { userPromise: Promise<User> }) {
  return (
    <Suspense fallback={<div>Loading profil pengguna...</div>}>
      <UserProfileCard userPromise={userPromise} />
    </Suspense>
  );
}
```

#### B. Conditional Context Consumption

Tidak seperti `useContext` yang wajib dipanggil di level teratas komponen, `use(Context)` dapat dipanggil di dalam kondisi `if`.

```tsx
"use client";

import { use, createContext } from "react";

const ThemeContext = createContext<string>("light");

export function DynamicPanel({ showTheme }: { showTheme: boolean }) {
  if (showTheme) {
    const theme = use(ThemeContext); // Boleh dipanggil di dalam percabangan
    return <div className={`theme-${theme}`}>Panel dengan tema {theme}</div>;
  }

  return <div>Panel standar</div>;
}
```

---

## 3. Fitur Konkuensi & Peningkatan Performa

### 3.1. Async Transitions (`useTransition`)

Pada React 19, fungsi yang dipassing ke `startTransition` dapat berupa **async function**. React akan secara otomatis menandai status pending selama operasi async berlangsung.

```tsx
"use client";

import { useState, useTransition } from "react";

export function TabContainer() {
  const [isPending, startTransition] = useTransition();
  const [tabData, setTabData] = useState<string | null>(null);

  function handleTabChange(tabId: string) {
    startTransition(async () => {
      const data = await fetchTabData(tabId);
      setTabData(data);
    });
  }

  return (
    <div>
      <div className="flex gap-2">
        <button
          onClick={() => handleTabChange("overview")}
          className="p-2 border"
        >
          Overview
        </button>
        <button
          onClick={() => handleTabChange("analytics")}
          className="p-2 border"
        >
          Analytics
        </button>
      </div>

      {isPending ? (
        <div>Memuat tab...</div>
      ) : (
        <div className="mt-4">{tabData}</div>
      )}
    </div>
  );
}

async function fetchTabData(tab: string) {
  await new Promise((r) => setTimeout(r, 800));
  return `Konten untuk ${tab}`;
}
```

---

## 4. Perubahan Arsitektur & PerbaikanDX Utama

### 4.1. Ref sebagai Prop (Penghapusan `forwardRef`)

Di React 19, `ref` secara resmi dapat dipassing langsung sebagai prop standar pada Function Component. Penggunaan `forwardRef` kini tidak lagi diperlukan (_deprecated_).

```tsx
// React 19 Way:
type CustomInputProps = {
  label: string;
  ref?: React.Ref<HTMLInputElement>;
};

export function CustomInput({ label, ref }: CustomInputProps) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input ref={ref} className="border p-2 w-full rounded mt-1" />
    </label>
  );
}
```

### 4.2. Penanganan Asset Loading Ditingkatkan (`<script>`, `<link>`, `<style>`)

React 19 dapat memuat stylesheet, script, dan font dengan optimasi penempatan otomatis di `<head>` serta melakukan de-duplikasi asset.

```tsx
export function ExternalWidget() {
  return (
    <div>
      {/* React 19 akan memindahkan tag ini ke <head> secara otomatis */}
      <link
        rel="stylesheet"
        href="https://example.com/widget.css"
        precedence="default"
      />
      <script async src="https://example.com/widget.js" />

      <h2>Komponen Widget</h2>
    </div>
  );
}
```

---

## 5. Summary & Best Practices

1. **Gunakan `useActionState` daripada `useState` + manual `try/catch` untuk mutasi data**: Mempermudah penanganan status `isPending` dan error handling secara terintegrasi.
2. **Optimasi Respon UI dengan `useOptimistic`**: Untuk interaksi ringan seperti Like, Bookmark, dan Chat messaging.
3. **Pemanfaatan `ref` sebagai Prop**: Sederhanakan komponen form atomic tanpa membungkus komponen dengan `forwardRef`.
4. **Manfaatkan Async Transitions**: Hindari blocking UI rendering saat mengolah request asynchronous skala besar.
