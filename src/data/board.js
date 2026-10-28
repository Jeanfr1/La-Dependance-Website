// Geometry of the approved board (references/Modele3-A-Part-Approuve.png, 734 x 2141),
// in board px. Measured with scripts/register-board.py (SIFT) and scripts/fit-type.py;
// plate boxes are the registered positions, rounded to 0.1 px.
// Desktop (>= 1024 px) draws the board in a centred frame at --u = min(100cqw, 1600px) / 1024.

export const BOARD_W = 734;

export const sections = {
  hero: { top: 0, h: 508 },
  place: { top: 508, h: 343 },
  services: { top: 851, h: 312 },
  creations: { top: 1163, h: 284 },
  team: { top: 1447, h: 400 },
  booking: { top: 1745, h: 396 },
};

// TODO(dependance): permission for the real photos taken from the institute's Google / Instagram pages.
export const plates = {
  // hero foreground: D + portrait cut-out, rotated -1.07 deg about its top-left corner
  // owner plate (identite/, 2026-10-28) at the approved plate's scale, moved 32 px right so the
  // D's stem clears the period of « À PART. »
  portrait: { x: 328.8, y: 49.5, w: 466.1, h: 570.1, rotate: -1.074 },
  // section-relative boxes
  interior: { x: -7.7, y: -75.2, w: 886.8, h: 496.6 },
  nails: { x: 103, y: -310, w: 861, h: 1017 },
  team: { x: 285.6, y: -102.4, w: 409.1, h: 504.6 },
  booking: { x: 18.2, y: 9.7, w: 702, h: 395.1 },
  phone: { x: 381.8, y: 60.9, w: 164.6, h: 88.2 },
};

// The rose arc: lower edge of the hero foreground and the thin line over the interior.
// Board coordinates; the left end continues flat along the hero's bottom edge.
export const arc = [
  [300, 508], [400, 512], [500, 525], [580, 550], [625, 572], [680, 615],
  [710, 655], [734, 720], [750, 775], [762, 830], [770, 880], [782, 1000],
];

// Top edge of the interior where it rises behind the D's outer bowl (board coords).
export const bowl = [
  [724, 508], [738, 485], [747, 468], [754, 452], [760, 435], [764, 433],
];

// Team photo bottom edge = booking diagonal: y = 1747 + 0.102 x (board).
export const diagonal = { y0: 1747, slope: 0.102 };
