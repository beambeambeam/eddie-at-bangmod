import type { Item } from "@eddie-at-bangmod/game";
import { Instance, Instances } from "@react-three/drei";

type Form = "sphere" | "capsule" | "box" | "cylinder" | "cone";

interface ProduceLook {
  form: Form;
  /** Width, height and depth of one piece. */
  size: [number, number, number];
  colors: readonly string[];
  roughness: number;
  /** Pieces across and deep on the counter tray. */
  grid: [number, number];
  /** Extra layers stacked as a heap; 1 means a flat spread. */
  layers: number;
}

const PRODUCE: Record<Item, ProduceLook> = {
  basil: {
    form: "cone",
    size: [0.2, 0.26, 0.2],
    colors: ["#3f7d33", "#2f6a2a", "#4c8f3a"],
    roughness: 0.85,
    grid: [6, 2],
    layers: 1,
  },
  pork: {
    form: "box",
    size: [0.28, 0.1, 0.2],
    colors: ["#e9a3a0", "#dd8c8a", "#f1b8b0"],
    roughness: 0.45,
    grid: [5, 2],
    layers: 1,
  },
  egg: {
    form: "sphere",
    size: [0.1, 0.13, 0.1],
    colors: ["#f2e3c8", "#e9cfa6", "#f6ecd9"],
    roughness: 0.4,
    grid: [9, 3],
    layers: 2,
  },
  rice: {
    form: "cylinder",
    size: [0.32, 0.36, 0.32],
    colors: ["#e8dcc0", "#ddd0b0", "#efe6cf"],
    roughness: 0.95,
    grid: [4, 1],
    layers: 1,
  },
  chili: {
    form: "capsule",
    size: [0.05, 0.1, 0.05],
    colors: ["#c8231b", "#a91a14", "#e0391f"],
    roughness: 0.3,
    grid: [12, 3],
    layers: 2,
  },
  garlic: {
    form: "sphere",
    size: [0.13, 0.12, 0.13],
    colors: ["#efe7e0", "#e3d3d8", "#f4eee6"],
    roughness: 0.7,
    grid: [8, 2],
    layers: 2,
  },
  "fish-sauce": {
    form: "cylinder",
    size: [0.1, 0.32, 0.1],
    colors: ["#7a3b12", "#8c4a17", "#6b300d"],
    roughness: 0.15,
    grid: [8, 2],
    layers: 1,
  },
  lime: {
    form: "sphere",
    size: [0.12, 0.12, 0.12],
    colors: ["#6aa82e", "#5a9a26", "#7cb83a"],
    roughness: 0.5,
    grid: [9, 3],
    layers: 2,
  },
};

/** A fixed small offset per piece, so heaps look loose but never flicker. */
const wobble = (index: number, salt: number) =>
  Math.sin(index * 12.9898 + salt * 78.233) * 0.5;

const Piece = ({ form }: { form: Form }) => {
  switch (form) {
    case "sphere": {
      return <sphereGeometry args={[0.5, 16, 12]} />;
    }

    case "capsule": {
      return <capsuleGeometry args={[0.5, 0.6, 4, 8]} />;
    }

    case "box": {
      return <boxGeometry args={[1, 1, 1]} />;
    }

    case "cylinder": {
      return <cylinderGeometry args={[0.5, 0.5, 1, 16]} />;
    }

    case "cone": {
      return <coneGeometry args={[0.5, 1, 8]} />;
    }

    default: {
      return null;
    }
  }
};

/**
 * Model slot `produce-<item>`: the goods heaped on a Stall's tray. The tray
 * top is y = 0 and spans `width` by `depth`, centered on the origin. Every
 * piece is one instance, so a whole heap costs a single draw call.
 */
export const ProduceModel = ({
  item,
  width,
  depth,
}: {
  item: Item;
  width: number;
  depth: number;
}) => {
  const look = PRODUCE[item];
  const [across, deep] = look.grid;
  const [sx, sy, sz] = look.size;
  /** Chilies lie on their side; everything else stands up. */
  const lying = look.form === "capsule";
  const height = lying ? sx : sy;
  const pieces = [];

  for (let layer = 0; layer < look.layers; layer += 1) {
    const inset = layer * 0.6;

    for (let row = 0; row < deep - inset; row += 1) {
      for (let column = 0; column < across - inset; column += 1) {
        const index = pieces.length;
        const x = ((column + 0.5 + inset / 2) / across - 0.5) * width;
        const z = ((row + 0.5 + inset / 2) / deep - 0.5) * depth;
        pieces.push(
          <Instance
            key={index}
            position={[
              x + wobble(index, 1) * sx * 0.4,
              height / 2 + layer * height * 0.75,
              z + wobble(index, 2) * sz * 0.4,
            ]}
            rotation={[
              lying ? Math.PI / 2 : 0,
              wobble(index, 3) * Math.PI,
              wobble(index, 4) * 0.3,
            ]}
            scale={[sx, sy, sz]}
            color={look.colors[index % look.colors.length]}
          />
        );
      }
    }
  }

  return (
    <Instances limit={pieces.length} castShadow receiveShadow>
      <Piece form={look.form} />
      <meshStandardMaterial roughness={look.roughness} />
      {pieces}
    </Instances>
  );
};
