---
title: "Magnetizing Field Requirements for Ferrite, NdFeB, SmCo and Alnico"
seo:
  title: Magnetizing Field for Ferrite, NdFeB, SmCo & Alnico Magnets
  description: Approximate magnetizing fields to saturate ferrite, NdFeB, SmCo and alnico magnets, the 3× coercivity rule of thumb, unit conversions and saturation tests.
excerpt: Every magnet material needs a different field before it is fully magnetized. This guide gives approximate saturation fields for ferrite, NdFeB, samarium cobalt and alnico, explains the rule of thumb behind them, and shows how to confirm saturation on real parts.
type: Specifications Explained
published: 2026-09-22
illustration: block
products:
  - magnet-charging-machine
  - magnetizing-coil
categories:
  - magnetizing-machines
faqs:
  - q: Can a magnet be over-magnetized?
    a: No. Once a magnet is saturated, a stronger pulse adds nothing to its magnetization. The extra energy only heats the coil or fixture and increases the mechanical stress on it, so there is no benefit in running far above the saturation point.
  - q: Do I need separate machines for ferrite and NdFeB magnets?
    a: Not necessarily. A machine and fixture sized for NdFeB can usually magnetize ferrite parts of similar size at a lower voltage setting. The reverse is rarely true, because a system sized only for ferrite will not reach the field NdFeB needs.
  - q: Can a magnet be re-magnetized in a different direction?
    a: Yes, but the pulse must first overcome the existing magnetization. Reversing or re-orienting a magnetized part often needs at least as much field as magnetizing it from the unmagnetized state, and sometimes more, so check results carefully.
  - q: How can I tell whether a single magnet was fully magnetized?
    a: One gauss reading on its own cannot prove saturation. Compare the part against a reference magnetized at a confirmed saturating setting, or pulse a sample again at a higher setting. If its output rises noticeably, it was not saturated the first time.
sample: true
---

The most common reason a magnet underperforms is not a bad material but an incomplete magnetization. If the field inside the magnet never reaches the level its material needs, the part leaves the machine only partly charged. This article sets out roughly how much field each of the four main permanent magnet materials needs, and how to check that you are getting there.

## Key takeaways

- A magnet should be driven to saturation. Below that point, output is lower and varies from part to part.
- A widely used rule of thumb is a magnetizing field of about three times the material's intrinsic coercivity (Hcj). Some sources quote two to three times.
- Approximate saturation fields: ferrite about 1–1.5 T, NdFeB about 2.5–3.5 T, SmCo about 3.5–5 T and alnico about 0.3–0.5 T.
- The figure that matters is the field inside the magnet, which is affected by fixture design, air gaps, surrounding steel and eddy currents.
- A saturation test on real parts is the most reliable way to set the production voltage.

## Why full saturation matters

Magnetizing aligns the magnetic domains in the material. When every domain that can align has done so, the magnet is saturated and reaches the remanence its grade allows. A partly magnetized magnet produces less flux, so a motor loses torque, a loudspeaker loses sensitivity and a sensor gives a weaker signal. Worse, the shortfall is rarely uniform, so output varies across a batch in ways that are hard to trace.

## The rule of thumb and its limits

Intrinsic coercivity, Hcj, describes how strongly a magnet resists demagnetization. It also gives a useful first estimate of how hard the magnet is to magnetize. The common guideline is to apply a field of about three times Hcj, and in any case comfortably above the point at which the material stops responding.

Treat this as a starting point rather than a specification. For high-coercivity grades, applying the multiplier literally can give very large figures. Many magnet suppliers state a recommended magnetizing field on their datasheets, and a saturation test on the actual part is the final word.

## Units at a glance

Magnetizing fields are quoted in teslas, kilo-oersteds or kiloamperes per metre. In air, they convert as follows:

| Value | Approximate equivalents (in air) |
| --- | --- |
| 1 T | 10 kOe, about 796 kA/m |
| 1 kOe | 0.1 T, about 79.6 kA/m |
| 1,000 kA/m | about 12.6 kOe, about 1.26 T |

## Approximate fields by material

| Material | Typical Hcj (approx.) | Approx. field to saturate | Electrically conductive? |
| --- | --- | --- | --- |
| Hard ferrite (strontium or barium) | About 2–5 kOe | About 1–1.5 T (10–15 kOe) | No |
| Sintered NdFeB | About 12 kOe to over 30 kOe, depending on grade | About 2.5–3.5 T (25–35 kOe) | Yes |
| Samarium cobalt (SmCo) | Commonly about 15 kOe and above | About 3.5–5 T (35–50 kOe) | Yes |
| Alnico | About 0.5–2 kOe | About 0.3–0.5 T (3–5 kOe) | Yes |

These are approximate, general figures. Always check the magnet supplier's data for the grade you use.

### Ferrite

Ferrite is the easiest of the high-volume materials to magnetize and, being ceramic, it does not suffer from eddy currents. It is widely magnetized after assembly in DC motor housings and loudspeakers, and in batches as loose magnets.

### NdFeB

Sintered NdFeB needs a much stronger field. High-coercivity grades used for elevated temperatures, such as SH, UH and EH, sit at the upper end of the range and can need more. NdFeB is electrically conductive, so thick parts and magnets fitted inside steel assemblies need a pulse long enough to penetrate fully.

### Samarium cobalt

SmCo is among the most demanding materials to magnetize. Sm₂Co₁₇ grades are generally harder to saturate than SmCo₅. Both need a high-energy system and a fixture built to withstand the resulting forces.

### Alnico

Alnico needs comparatively little field, but its low coercivity means it is also easily demagnetized by handling, stray fields or poor magnetic circuit design. For that reason it is usually magnetized in its final assembly. Higher-coercivity grades, such as alnico 8, need more field than the common grades.

## From field to machine

A coil's nominal field figure is not the field inside your magnet. The field actually reaching the material depends on:

- **Fixture geometry.** A [magnetizing coil](/products/magnetizing-fixtures-coils/magnetizing-coil/) for loose magnets gives a fairly uniform field, while radial and multi-pole fixtures concentrate it in specific regions.
- **Air gaps.** Clearance between the winding and the magnet reduces the field at the part.
- **Surrounding steel.** Rotor cores and housings can help guide flux, or can divert it away from the magnet if the fixture is not designed around them.
- **Eddy currents.** In conductive magnets and steel, they oppose short pulses and delay penetration of the field.
- **Pole pitch.** In [multi-pole magnetizing](/blog/multipole-magnetizing-explained/), closely spaced poles make it harder to drive full field deep into the magnet.

The required field and these factors together set the energy and voltage the magnetizer needs. Our guide on [how to choose a magnetizer](/blog/how-to-choose-magnetizer/) covers the sizing steps, and [how a capacitor discharge magnetizer works](/blog/how-capacitor-discharge-magnetizer-works/) explains the pulse itself.

## How to confirm saturation in practice

A saturation test is simple and needs no special theory:

1. Take several unmagnetized samples of the real part.
2. Magnetize them at increasing charging voltages, one setting per sample.
3. Measure each one with a flux meter and Helmholtz coil, or with a gauss meter in a repeatable position.
4. Plot the reading against voltage. The curve rises steeply, then flattens.
5. Set the production voltage with a sensible margin above the point where the curve flattens.

[Magnet manufacturers](/industries/magnet-manufacturers/) use the same approach when [magnetizing loose magnets](/applications/loose-magnet-magnetizing/) before dispatch, and it is equally useful when [recharging magnets](/applications/magnet-recharging/) that have weakened in service.

## Need help choosing?

If you are unsure whether your current set-up saturates your parts, or you are planning to magnetize a new material, share the magnet grade, part drawing and output required. The SK Enterprises team can recommend a [magnet charging machine](/products/magnetizing-machines/magnet-charging-machine/) and coil or fixture to suit. {{Confirm whether SK Enterprises can run saturation tests on customer samples.}}

[Ask for a quotation](/get-quote/?product=magnet-charging-machine) or [contact our team](/contact/).
