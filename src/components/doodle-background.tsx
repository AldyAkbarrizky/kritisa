export function DoodleBackground() {
  return (
    <>
      {/* Dekorasi margin: butuh ruang kosong di sisi kanvas, jadi baru muncul
          dari sm ke atas. `-z-10` menjaganya tetap di belakang konten —
          dengan `z-0` doodle ikut tercetak di atas kartu. */}
      <img
        src="/brand/doodle-left.svg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none fixed -z-10 hidden w-[8.5rem] sm:block md:w-[11rem]"
        style={{ left: "0.75rem", top: "5.25rem" }}
      />
      <img
        src="/brand/doodle-right.svg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none fixed -z-10 hidden w-[10.5rem] sm:block md:w-[14rem]"
        style={{ right: "-1.75rem", bottom: "2rem" }}
      />
    </>
  );
}
