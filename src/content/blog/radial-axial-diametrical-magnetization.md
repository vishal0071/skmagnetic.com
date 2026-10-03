---
title: Radial vs Axial vs Diametrical Magnetization Explained
seo:
  title: Radial vs Axial vs Diametrical Magnetization Explained
  description: "Radial, axial and diametrical magnetization compared: where the poles sit, typical parts, the coil or fixture each needs and how to specify it on a drawing."
excerpt: The same ring or disc magnet can be magnetized in several directions, and each one needs different tooling. This guide compares axial, diametrical and radial magnetization, their multi-pole versions and how to specify the right one.
type: Specifications Explained
published: 2026-10-03
illustration: fixture
products:
  - multipole-magnetizing-fixture
  - magnetizing-coil
  - rotor-magnetizer
categories:
  - magnetizing-fixtures-coils
faqs:
  - q: Is radial magnetization the same as diametrical magnetization?
    a: No. In diametrical magnetization the field runs straight across the part, so one half of the curved surface is north and the other half is south. In radial magnetization the field runs outward from the centre, so the whole outer surface is one pole and the bore or centre is the other.
  - q: Can an axially magnetized magnet be changed to diametrical magnetization?
    a: Only if the material allows it. An isotropic magnet can be re-magnetized in a new direction with a strong enough pulse. An anisotropic magnet, which includes most sintered NdFeB and ferrite, has a preferred direction set during manufacture and only reaches full strength along that direction, so changing it gives a much weaker magnet.
  - q: How can I check which way a magnet is magnetized?
    a: Magnetic viewing film shows the pole layout as light and dark areas. A gaussmeter probe moved over the surface shows where the field is strongest and its polarity, and a simple compass identifies north and south. For multi-pole parts, a Hall-probe scan around the part gives the full pattern.
  - q: Which magnetization direction gives the strongest magnet?
    a: None is stronger in itself. Performance depends on the magnet material, whether it is oriented in that direction, its length along the magnetization direction and the steel around it in the final assembly. The right direction is the one the product design needs, made from material oriented to match.
sample: true
---

A ring or disc magnet looks the same whichever way it is magnetized, but where its north and south poles sit changes how it behaves in a motor, sensor or holding device. Magnet drawings use terms such as axial, diametrical and radial for this, and each one calls for a different coil or fixture. This guide explains the differences in plain terms.

## Key takeaways

- **Axial magnetization** puts the poles on the flat faces, with the field running through the thickness. A solenoid coil handles it.
- **Diametrical magnetization** puts the poles on opposite sides of the curved surface, with the field running straight across the part.
- **Radial magnetization** puts one pole on the outer diameter and the other on the inner diameter or centre, with the field running outward from the axis.
- Each pattern also has a multi-pole version, with several alternating poles on the face or around the diameter.
- Anisotropic magnets must be ordered with an orientation that matches the magnetization direction you need.

## The three directions at a glance

| Pattern | Where the poles sit | Field inside the magnet | Typical parts | Typical tooling |
| --- | --- | --- | --- | --- |
| Axial | One flat face north, the other south | Parallel to the axis, through the thickness | Holding magnets, reed and Hall switch magnets, speaker rings | Solenoid magnetizing coil |
| Diametrical | One side of the curved surface north, the opposite side south | Straight across the diameter | Rotary angle sensor magnets, small two-pole rotors, couplings | Fixture or yoke with pole pieces on opposite sides |
| Radial | Outer surface one pole, inner surface or centre the other | Outward (or inward) from the axis | Some motor and coupling rings, arc segments | Special radial fixture |

## Axial magnetization

Axial is the most common direction for loose discs, rings and cylinders. The field runs along the axis of the part, so one flat face becomes north and the other south. A [magnetizing coil](/products/magnetizing-fixtures-coils/magnetizing-coil/) produces exactly this field: the part sits in the bore with its axis along the coil, and one pulse magnetizes it through its thickness. Batches of identical parts can be charged together if they fit in the uniform central zone of the coil, which is why axial charging is the backbone of [loose magnet magnetizing](/applications/loose-magnet-magnetizing/).

Axial magnetization is also used in axial-flux motors, where magnet segments on a flat disc are magnetized through their thickness with alternating polarity.

## Diametrical magnetization

In a diametrically magnetized disc or cylinder, the field runs straight across the diameter. Look at the curved surface and one half is north, the other half south. A common use is the small magnet on the end of a shaft that a magnetic angle sensor reads as the shaft turns: as the magnet rotates, the direction of its field turns with it.

Diametrical parts are magnetized with the field across the part rather than along it. That can be done with a fixture or yoke whose pole pieces sit on either side, or, for small parts, by placing the part crosswise in a coil bore so the field passes across its diameter.

### Axial or diametrical for a sensor?

The choice depends on what the sensor measures. A reed switch or Hall switch that detects a magnet approaching end-on usually works with an axially magnetized magnet. A sensor that measures rotation angle at the end of a shaft usually needs a diametrically magnetized one. The sensor maker's application notes normally state which pattern and magnet size suit the device; our page on [sensors and electronics](/industries/sensors-electronics/) covers typical parts.

## Radial magnetization

In radial magnetization the field runs outward from the axis of a ring or arc. For a single-pole radial ring, the whole outer surface is one pole and the bore is the other. This is harder to produce than it sounds: the field has to be forced outward in every direction at once, which needs a special fixture rather than a simple coil, and the material should be radially oriented to reach full strength.

In practice, many motors get the same effect from arc segments, each magnetized through its thickness so that one curved face is north and the other south. Fitting the arcs into a rotor or housing with alternating polarity gives a radial pattern around the circumference.

### Radial vs axial in motors

Most conventional motors are radial-flux designs: the field crosses a cylindrical air gap between the rotor and the stator, so the magnets are magnetized radially. Axial-flux motors have a flat, disc-shaped air gap, so their magnets are magnetized axially. The magnetization direction follows the direction of flux across the air gap.

## Multi-pole versions

Each basic direction has a multi-pole form:

- **Radial multi-pole** — several alternating poles around the outer or inner diameter of a ring or rotor, as used in BLDC motors.
- **Face (axial) multi-pole** — alternating poles on the flat face of a disc or ring, as used in encoders and axial sensors.

These patterns are created in one pulse by a [multi-pole magnetizing fixture](/products/magnetizing-fixtures-coils/multipole-magnetizing-fixture/) with conductors set at each pole boundary. For assembled motor rotors, the fixture is supplied as part of a [rotor magnetizer](/products/magnetizing-machines/rotor-magnetizer/). Our article on [multi-pole magnetizing](/blog/multipole-magnetizing-explained/) explains pole count, pole pitch and skew in more detail.

## Orientation decides what is possible

Magnets are either isotropic or anisotropic. Isotropic magnets, such as many bonded NdFeB and some bonded ferrite parts, have no preferred direction, so they can be magnetized axially, diametrically, radially or multi-pole. Anisotropic magnets, which include most sintered ferrite and NdFeB, are oriented during pressing and only reach full strength when magnetized in that direction. An axially oriented disc cannot be turned into a strong diametrical magnet later, so the magnetization direction has to be settled before the magnets are ordered.

## Specifying direction on a drawing

To avoid misunderstandings, a magnet drawing should state:

- the magnetization direction in words (axial, diametrical, radial or multi-pole), plus an arrow on the view;
- for multi-pole parts, the pole count and whether poles are on the outer diameter, inner diameter or face;
- which face or side must be north, where polarity matters;
- the orientation of anisotropic material; and
- how the result will be checked, such as gaussmeter readings at defined points or a pole scan.

## Need help choosing?

If you are unsure which pattern your part needs, or which coil or fixture will produce it, send us the part drawing, magnet material and grade, required pattern and production rate. {{Confirm whether SK Enterprises can trial-magnetize sample parts in the requested pattern.}}

[Request a quotation](/get-quote/) or [contact the SK Enterprises team](/contact/) to discuss your part.
