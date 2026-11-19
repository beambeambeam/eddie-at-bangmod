import { Button, Heading, Sheet, StickyNote } from "@plop-ui/react";
import { useEffect, useRef } from "react";

const CARDS = [
  {
    title: "Move",
    tone: "mustard",
    text: "Put a thumb down anywhere and drag to steer Eddie. On a keyboard, use WASD or the arrow keys.",
  },
  {
    title: "Grab the list",
    tone: "mint",
    text: "Walk into the front of a Stall to grab its Item. Get all 3 Items on the Shopping List, in any order.",
  },
  {
    title: "Dodge Hazards",
    tone: "pink",
    text: "Crowds slow Eddie down. A Motorbike or the Soi Dog Stuns him for 1.5 s and resets the Combo.",
  },
] as const;

/**
 * The how-to Sheet: three cards on how a Run works. It shows before a
 * Device's first Run, and the "?" button opens it again. Closing it with
 * the button or Escape hands the play screen back.
 */
export const HowTo = ({ onClose }: { onClose: () => void }) => {
  const close = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    close.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <dialog
      open
      aria-modal="true"
      aria-labelledby="how-to-title"
      className="absolute inset-0 m-0 flex h-full w-full max-w-none justify-center overflow-y-auto border-0 bg-transparent p-4 text-inherit"
    >
      <Sheet
        tape="mustard"
        tilt={1}
        className="my-auto flex w-full max-w-72 flex-col items-center gap-3 p-5 text-center"
      >
        <Heading level={2} id="how-to-title" writeOn={false}>
          How to play
        </Heading>
        <ol
          className="m-0 flex w-full list-none flex-col gap-2 p-0 text-left"
          style={{ fontFamily: "var(--plop-font-body)" }}
        >
          {CARDS.map(({ title, tone, text }, index) => (
            <li key={title}>
              <StickyNote tone={tone} tilt={index % 2 === 0 ? -1 : 1}>
                <h3
                  className="m-0 text-base uppercase"
                  style={{ fontFamily: "var(--plop-font-letter)" }}
                >
                  {`${index + 1} · ${title}`}
                </h3>
                <p className="m-0 mt-1 text-sm">{text}</p>
              </StickyNote>
            </li>
          ))}
        </ol>
        <div className="sticky bottom-0 z-10 pt-1">
          <Button
            ref={close}
            onClick={onClose}
            variant="periwinkle"
            buddy
            buddyMood="congrats"
          >
            Got it
          </Button>
        </div>
      </Sheet>
    </dialog>
  );
};
