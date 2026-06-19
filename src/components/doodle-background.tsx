export function DoodleBackground() {
  return (
    <>
      <img
        src="/brand/doodle-left.svg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none fixed z-0 w-[8.5rem] md:w-[11rem]"
        style={{ left: "0.75rem", top: "5.25rem" }}
      />
      <img
        src="/brand/doodle-right.svg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none fixed z-0 w-[10.5rem] md:w-[14rem]"
        style={{ right: "-1.75rem", bottom: "2rem" }}
      />
    </>
  );
}
