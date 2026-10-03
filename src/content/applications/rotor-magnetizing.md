---
title: Rotor Magnetizing
seo:
  title: Rotor Magnetizing for BLDC & PMSM Motors | SK Enterprises
  description: Magnetize BLDC, PMSM and servo motor rotors after assembly with a rotor magnetizer and matched fixture, with the correct pole count, pole accuracy and skew.
summary: Magnetizing assembled motor rotors in one pulse, with the pole count, pole accuracy and skew the motor design calls for.
intro: >-
  Rotor magnetizing is the step that turns an assembled rotor with unmagnetized magnets into
  a working motor part. A magnetizer and a rotor-specific fixture create every pole in a
  single pulse, so the rotor can be built cleanly and magnetized at the end.
icon: motor
products:
  - rotor-magnetizer
  - multipole-magnetizing-fixture
  - magnet-charging-machine
industries:
  - electric-motors
  - home-appliances
  - automotive-components
faqs:
  - q: How do surface-magnet and interior-magnet rotors differ when magnetizing?
    a: Surface magnets sit directly under the fixture poles, so the field reaches them easily. Interior (IPM) magnets are buried in the laminations, so the field must pass through steel first, which typically needs more energy and careful fixture design.
  - q: Can the poles be skewed?
    a: Yes. A fixture can be built with skewed conductors so the poles are magnetized at an angle along the rotor, which is often used to reduce cogging torque. Skew is most straightforward on one-piece ring magnets.
  - q: How do we check that a rotor is fully magnetized?
    a: Peak-current monitoring confirms that every pulse reached its set level. A flux or gauss measurement on the rotor, or a back-EMF test on the assembled motor, confirms the result.
  - q: What do you need to design a rotor fixture?
    a: "The rotor drawing, magnet material and grade, pole count, any skew, and your target cycle time. {{Confirm whether SK Enterprises needs sample rotors for fixture trials}}"
order: 1
sample: true
---

## Why rotors are magnetized after assembly

Fitting magnetized segments to a rotor is slow and awkward. Magnets jump out of position, chip against each other and pick up steel debris that can later cause noise. Assembling the magnets unmagnetized and magnetizing the finished rotor avoids these problems, makes automation simpler and gives a consistent pole pattern from one rotor to the next.

## How rotor magnetizing works

A [capacitor discharge magnetizer](/products/magnetizing-machines/magnet-charging-machine/) sends a pulse lasting a few milliseconds through a fixture shaped around the rotor. Conductors in the fixture create alternating north and south poles at fixed positions, so the fixture alone decides the pole count and layout.

### Inner and outer rotors

- **Inner-rotor motors:** the rotor sits inside the fixture bore.
- **Outer-rotor motors**, such as many ceiling fan and hub motors: the fixture sits inside the rotor cup.

### Field strength

The fixture must create enough field at the magnet to saturate it. A common rule of thumb is a field of about three times the magnet's intrinsic coercivity (Hcj). In practice that typically means roughly 1–1.5 T for ferrite and 2.5–3.5 T for sintered NdFeB. Our article on [magnetizing field requirements](/blog/magnetizing-field-requirements/) explains this in more detail.

### Pole accuracy and skew

Pole positions depend on how precisely the fixture conductors are placed and how the rotor is located in the fixture. Some designs also call for skewed poles to reduce cogging torque, and this is built into the fixture.

## Practical considerations

- **Eddy currents:** solid steel hubs and conductive NdFeB magnets carry eddy currents during the pulse, which oppose the field, so pulse length and fixture design are matched to the rotor.
- **Cycle rate:** fixture cooling, more than the pulse itself, sets how often the station can fire.
- **Pole count:** high pole counts need finer fixture conductors; see [multi-pole magnetizing](/applications/multipole-magnetizing/) for the trade-offs.

A purpose-built [rotor magnetizer](/products/magnetizing-machines/rotor-magnetizer/) combines the machine and fixture as one matched system, which is usually the simplest way to set up a production station.

## Enquire about rotor magnetizing

SK Enterprises designs and manufactures rotor magnetizers and fixtures in Maharashtra, India. {{Confirm rotor sizes and pole counts SK Enterprises has built fixtures for.}} [Request a quotation](/get-quote/) with your rotor drawing and magnet details.
