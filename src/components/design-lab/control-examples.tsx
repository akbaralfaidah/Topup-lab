"use client";

import { useState } from "react";
import { Info, MoreHorizontal, Plus } from "lucide-react";
import { Button, IconButton, Link } from "@/components/ui/actions";
import {
  Checkbox,
  Field,
  FormMessage,
  Input,
  Radio,
  Select,
  Switch,
  Textarea,
} from "@/components/ui/forms";
import {
  Alert,
  Badge,
  Card,
  Divider,
  EmptyState,
  Progress,
  Skeleton,
  Spinner,
  StatusBadge,
} from "@/components/ui/feedback";
import {
  Dialog,
  DialogClose,
  Drawer,
  BottomSheet,
  Dropdown,
  Popover,
  Tooltip,
} from "@/components/ui/overlays";
import { Accordion, Pagination, Tabs } from "@/components/ui/navigation";
import { Table } from "@/components/ui/data";
import { useToast } from "@/components/ui/toast";
import { LabSection } from "./foundations";

export function ControlExamples() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  return (
    <LabSection
      id="controls"
      title="Kontrol"
      description="Satu tindakan utama per area keputusan. Target sentuh minimum 44px, fokus terlihat, dan proses memiliki label."
    >
      <div className="lab-row">
        <Button
          onClick={() =>
            toast("Tindakan utama dicoba. Tidak ada data disimpan.")
          }
        >
          Coba tindakan
        </Button>
        <Button
          variant="secondary"
          onClick={() => toast("Tindakan sekunder dicoba.")}
        >
          Lihat contoh
        </Button>
        <Button
          variant="tertiary"
          onClick={() => toast("Pilihan contoh dibatalkan.")}
        >
          Batal
        </Button>
        <Button
          variant="danger"
          onClick={() => toast("Tombol hapus dicoba. Tidak ada data dihapus.")}
        >
          Hapus contoh
        </Button>
        <IconButton
          label="Tambah contoh"
          variant="secondary"
          onClick={() => toast("Tombol tambah dicoba. Tidak ada data dibuat.")}
        >
          <Plus size={20} />
        </IconButton>
      </div>
      <div className="lab-row">
        <Button
          size="small"
          variant="secondary"
          onClick={() => toast("Ukuran ringkas tetap memiliki target 44px.")}
        >
          Ringkas
        </Button>
        <Button
          size="large"
          variant="secondary"
          onClick={() => toast("Ukuran besar dicoba.")}
        >
          Ukuran besar
        </Button>
        <Button disabled>Belum tersedia</Button>
        <Button
          loading={loading}
          onClick={() => setLoading(true)}
          loadingLabel="Memuat contoh…"
        >
          Mulai contoh memuat
        </Button>
        {loading && (
          <Button variant="secondary" onClick={() => setLoading(false)}>
            Selesaikan contoh
          </Button>
        )}
        <Link href="#forms">Ke contoh formulir</Link>
      </div>
    </LabSection>
  );
}

export function FormExamples() {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [enabled, setEnabled] = useState(true);
  return (
    <LabSection
      id="forms"
      title="Formulir"
      description="Label selalu terlihat. Pesan membantu pengguna memperbaiki input; contoh ini hanya memeriksa isian di browser."
    >
      <div className="lab-split">
        <form
          className="lab-stack"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            setError(
              value.trim() ? "" : "Masukkan kode contoh terlebih dahulu.",
            );
            setSaved(Boolean(value.trim()));
          }}
        >
          <Field
            label="Kode contoh"
            required
            hint="Gunakan teks apa pun untuk mencoba validasi."
            error={error}
          >
            {(props) => (
              <Input
                {...props}
                required
                value={value}
                onChange={(event) => {
                  setValue(event.target.value);
                  setSaved(false);
                }}
                placeholder="DEMO-001"
              />
            )}
          </Field>
          <Field label="Catatan opsional">
            {(props) => (
              <Textarea
                {...props}
                placeholder="Tulis catatan untuk contoh ini."
              />
            )}
          </Field>
          <Button type="submit">Periksa contoh</Button>
          {saved && (
            <FormMessage tone="success">
              Isian valid. Tidak ada data yang dikirim.
            </FormMessage>
          )}
        </form>
        <div className="lab-stack">
          <Field label="Kategori contoh">
            {(props) => (
              <Select {...props} defaultValue="credit">
                <option value="credit">Kredit demo</option>
                <option value="voucher">Voucher demo</option>
              </Select>
            )}
          </Field>
          <Field
            label="Input tidak tersedia"
            hint="Dikunci untuk menunjukkan tampilan nonaktif."
          >
            {(props) => <Input {...props} disabled value="Hanya contoh" />}
          </Field>
          <Checkbox label="Saya memahami ini hanya demonstrasi komponen." />
          <Checkbox label="Pilihan nonaktif" disabled />
          <fieldset className="lab-fieldset">
            <legend>Tampilan contoh</legend>
            <Radio
              name="density"
              value="comfortable"
              label="Nyaman"
              defaultChecked
            />
            <Radio name="density" value="compact" label="Ringkas" />
          </fieldset>
          <Switch
            label="Tampilkan bantuan"
            checked={enabled}
            onCheckedChange={setEnabled}
          />
          {enabled && (
            <p className="lab-note">
              Bantuan dapat disembunyikan dengan sakelar di atas.
            </p>
          )}
          <Switch
            label="Pengaturan nonaktif"
            checked={false}
            onCheckedChange={() => {}}
            disabled
          />
        </div>
      </div>
    </LabSection>
  );
}
export function FeedbackExamples() {
  const [value, setValue] = useState(40);
  const toast = useToast();
  return (
    <LabSection
      id="feedback"
      title="Umpan balik"
      description="Status memakai teks dan ikon. Pesan penting tetap terlihat di halaman, bukan hanya di toast."
    >
      <div className="lab-row">
        <Badge>Contoh</Badge>
        <StatusBadge>Menunggu pembayaran</StatusBadge>
        <StatusBadge tone="info">Sedang diproses</StatusBadge>
        <StatusBadge tone="warning">Menunggu konfirmasi</StatusBadge>
        <StatusBadge tone="success">Berhasil</StatusBadge>
        <StatusBadge tone="danger">Gagal</StatusBadge>
      </div>
      <div className="lab-split">
        <Alert tone="danger" title="Contoh belum dapat dimuat.">
          Coba muat ulang bagian ini beberapa saat lagi.
        </Alert>
        <Alert tone="success" title="Pilihan contoh tersimpan.">
          Pesan ini hanya menunjukkan tampilan sukses.
        </Alert>
      </div>
      <div className="lab-split">
        <div className="lab-stack">
          <div
            role="status"
            aria-label="Memuat contoh konten"
            className="lab-stack"
          >
            <Skeleton className="lab-skeleton-title" />
            <Skeleton />
            <Skeleton />
          </div>
          <div className="lab-row">
            <Spinner />
            <span>Memuat contoh…</span>
          </div>
        </div>
        <div className="lab-stack">
          <Progress label="Kemajuan demonstrasi" value={value} />
          <Button
            variant="secondary"
            onClick={() => setValue(value >= 100 ? 0 : value + 20)}
          >
            {value >= 100 ? "Ulangi contoh" : "Tambah kemajuan contoh"}
          </Button>
        </div>
      </div>
      <EmptyState
        title="Belum ada pilihan."
        description="Pilih salah satu contoh komponen untuk melihat tanggapannya."
        action={
          <Button
            variant="secondary"
            onClick={() =>
              toast("Pemberitahuan contoh. Tutup setelah selesai membacanya.")
            }
          >
            Coba pemberitahuan
          </Button>
        }
      />
    </LabSection>
  );
}
export function SurfaceExamples() {
  const toast = useToast();
  const content = (
    <>
      <Field label="Nama tampilan contoh">
        {(props) => <Input {...props} placeholder="Contoh pribadi" />}
      </Field>
      <DialogClose asChild>
        <Button>Selesai melihat</Button>
      </DialogClose>
    </>
  );
  return (
    <LabSection
      id="surfaces"
      title="Permukaan & overlay"
      description="Kartu mengelompokkan konten. Elevasi dipakai pada lapisan sementara, dengan fokus yang kembali ke pemicu."
    >
      <div className="lab-split">
        <Card>
          <h3>Kartu tanpa bayangan</h3>
          <p>Permukaan dan border cukup untuk membedakan kelompok informasi.</p>
          <Divider />
          <p className="lab-note">Radius kartu 16px · padding 24px</p>
        </Card>
        <div className="lab-stack">
          <div className="lab-row">
            <Dialog
              trigger={<Button variant="secondary">Buka dialog</Button>}
              title="Tinjau contoh"
              description="Ini demonstrasi dialog. Tidak ada transaksi atau data yang disimpan."
            >
              {content}
            </Dialog>
            <Drawer
              trigger={<Button variant="secondary">Buka drawer</Button>}
              title="Detail contoh"
              description="Panel samping pada desktop, bottom sheet pada ponsel."
            >
              {content}
            </Drawer>
            <BottomSheet
              trigger={<Button variant="secondary">Buka bottom sheet</Button>}
              title="Pilihan contoh"
              description="Lapisan ringkas yang dapat ditutup dengan Escape atau tombol tutup."
            >
              {content}
            </BottomSheet>
          </div>
          <div className="lab-row">
            <Popover
              label="Informasi contoh"
              trigger={<Button variant="secondary">Buka popover</Button>}
            >
              <p>
                Gunakan popover untuk penjelasan singkat yang dibuka pengguna.
              </p>
            </Popover>
            <Tooltip content="Informasi tambahan tentang komponen.">
              <IconButton label="Bantuan komponen" variant="secondary">
                <Info size={20} />
              </IconButton>
            </Tooltip>
            <Dropdown
              label="Tindakan contoh"
              trigger={
                <Button variant="secondary">
                  Tindakan
                  <MoreHorizontal size={20} />
                </Button>
              }
              items={[
                {
                  label: "Lihat keterangan",
                  onSelect: () =>
                    toast("Keterangan contoh dibuka melalui menu."),
                },
                {
                  label: "Atur ulang contoh",
                  onSelect: () =>
                    toast(
                      "Tombol atur ulang contoh dicoba. Tidak ada data diubah.",
                    ),
                },
                { label: "Tidak tersedia", disabled: true, onSelect: () => {} },
              ]}
            />
          </div>
        </div>
      </div>
    </LabSection>
  );
}
export function NavigationExamples() {
  return (
    <LabSection
      id="navigation"
      title="Navigasi"
      description="Tab memakai tombol panah. Accordion mempertahankan konteks dan dapat dibuka dengan keyboard."
    >
      <Tabs
        label="Contoh tampilan"
        items={[
          {
            value: "summary",
            label: "Ringkasan",
            content: (
              <p>
                Ringkasan contoh aktif. Semua informasi di sini hanya untuk
                peninjauan desain.
              </p>
            ),
          },
          {
            value: "details",
            label: "Rincian tampilan komponen",
            content: (
              <p>Rincian contoh aktif. Tab tetap terbaca pada layar sempit.</p>
            ),
          },
          {
            value: "disabled",
            label: "Belum tersedia",
            disabled: true,
            content: null,
          },
        ]}
      />
      <Accordion title="Apakah contoh ini membuat transaksi?">
        Tidak. Design Lab hanya mengubah tampilan lokal di browser.
      </Accordion>
      <Accordion title="Bagaimana jika animasi dikurangi?">
        Perubahan tetap terlihat secara langsung tanpa gerakan dekoratif.
      </Accordion>
    </LabSection>
  );
}
export function DataExamples() {
  const [page, setPage] = useState(1);
  const rows = [
    {
      id: "button",
      cells: [
        "Button",
        "Tindakan utama",
        <StatusBadge key="ready" tone="success">
          Siap ditinjau
        </StatusBadge>,
      ],
    },
    {
      id: "input",
      cells: [
        "Input",
        "Isian berlabel",
        <StatusBadge key="ready" tone="success">
          Siap ditinjau
        </StatusBadge>,
      ],
    },
    {
      id: "dialog",
      cells: [
        "Dialog",
        "Konfirmasi singkat",
        <StatusBadge key="ready" tone="info">
          Contoh interaktif
        </StatusBadge>,
      ],
    },
    {
      id: "drawer",
      cells: [
        "Drawer",
        "Detail tambahan",
        <StatusBadge key="ready" tone="info">
          Contoh interaktif
        </StatusBadge>,
      ],
    },
  ];
  return (
    <LabSection
      id="data"
      title="Tampilan data"
      description="Contoh inventaris komponen, bukan metrik bisnis. Di ponsel, setiap nilai tetap memiliki label."
    >
      <Table
        caption="Inventaris contoh komponen"
        columns={["Komponen", "Kegunaan", "Status"]}
        rows={rows.slice((page - 1) * 2, page * 2)}
      />
      <Pagination page={page} pages={2} onPageChange={setPage} />
    </LabSection>
  );
}
