# Where the sizing tool's numbers come from

Audit of every constant in the old engine (`site/js/engine.js`, `site/js/profiles.js`, `docs/method.md` in mc2068/kizuna-trigeneration), 22 Nov 2026.
> **Superseded for the engine by v2** (`engine/model.mjs`, `docs/engine/spec.md`), which applies the findings below and the idea critique. The table below audits v1's constants and is kept as the record.

Status: **Sourced** = a published figure used as-is; **Estimated** = derived from a source with our own rounding or reasoning; **Unverified** = team assumption with no source yet.

## Prices and money
| Assumption | Value | Basis | Status |
|---|---|---|---|
| Business electricity price (tool default, user can change) | 0.352 TND/kWh | [GlobalPetrolPrices, Tunisia business electricity](https://www.globalpetrolprices.com/Tunisia/electricity_prices/). This is the STEG MV *uniform* tariff **with VAT**: (291 + 5) mill x 1.19 = 0.352. Recommended: **0.296 TND/kWh HT** (uniform) or the time-of-use grid, see findings below | **Sourced (STEG via FIPA)**; tariff dates from 1 Oct 2022 |
| Natural gas price | 0.10 TND/kWh | Old basis: household gas 0.092 TND/kWh (GlobalPetrolPrices), rounded up. Found: STEG medium pressure MP1 = 71.1 + 0.25 (FTE) mill/thermie HT = **0.061 TND/kWh** (0.068 per kWh LHV), see findings below | **Sourced (STEG via FIPA)**; 0.10 is about 60% too high; tariff dates from 1 May 2022 |
| Engine cost | 2,000 TND/kWe | Tunisian fleet: 320 MTND for 163 MW, Ministry of Energy via [L'Economiste Maghrébin](https://www.leconomistemaghrebin.com/2024/05/04/163-megawatts-pour-les-projets-de-production-denergie-combinee/) | Sourced (national average, mostly industrial) |
| Absorption chiller cost | 900 TND/kWc | None | Unverified, **weak** |
| Maintenance | 0.02 TND/kWh produced | "Upper end of usual range", no citation | Unverified |
| FTE subsidy | 30% of investment | FTE covers up to 60% of the owner's contribution ([La Presse, Aug 2026](https://www.lapresse.tn/2026/08/11/tunisie-70-de-lenergie-industrielle-consommee-par-400-entreprises/)); 30% chosen to be conservative | Estimated, **weak** (eligibility for hotels not confirmed) |

## Emissions
| Assumption | Value | Basis | Status |
|---|---|---|---|
| Grid CO2 | 0.48 kg/kWh | [LowCarbonPower](https://lowcarbonpower.org/region/Tunisia): 467 g (2024) to 483 g (2025) | Sourced |
| Gas CO2 | 0.202 kg/kWh fuel | IPCC default 56.1 t CO2/TJ | Sourced |

## Equipment performance
| Assumption | Value | Basis | Status |
|---|---|---|---|
| Engine electrical efficiency | 36% | [US DOE CHP reciprocating engines fact sheet](https://betterbuildingssolutioncenter.energy.gov/sites/default/files/attachments/CHP_Reciprocating_Engines.pdf), typical 300 to 1,000 kWe | Estimated from a range |
| Heat recovered | 1.67 kWth per kWe | Same DOE sheet, Table 3 (100 kWe recovers 167 kWth) | Sourced (small-engine ratio applied to 450 kWe) |
| Absorption chiller COP | 0.70 | [DOE absorption chiller fact sheet](https://www.energy.gov/sites/default/files/2017/06/f35/CHP-Absorption%20Chiller-compliant.pdf), 0.70 to 0.79 | Sourced (low end) |
| Existing electric chiller COP | 3.0 | "Typical Tunisian hotel chillers and splits" | Unverified |
| Boiler efficiency | 92% | EU reference efficiency for hot water | Sourced |
| Engine run hours | 06:00 to 24:00 | Team choice | Unverified (design choice) |

## The hotel itself (load profiles)
| Assumption | Value | Basis | Status |
|---|---|---|---|
| Cooling share of electricity | 29% | [ANME audit of 137 Tunisian hotels via La Presse](https://www.lapresse.tn/2026/11/05/hotellerie-tunisienne-derriere-le-confort-des-touristes-le-defi-de-la-maitrise-energetique/) | Sourced, **the strongest Tunisian anchor** |
| Energy intensity | ~225 kWh/m2/yr, ~70 m2 per room | Mediterranean hotels: Italy 215, Greece 273, Spain 287 ([Bertolazzi et al.](https://www.research.unipd.it/retrieve/46ce16e3-4762-41ff-828e-786aa08b7a61/2023_Bertolazzi_Micocci_SBE_Thessaloniki.pdf)) | Estimated (no Tunisian figure) |
| Energy per guest-night | ~32 kWh | Above Balearic 18 to 24 ([ULPGC](https://accedacris.ulpgc.es/bitstream/10553/111029/1/Energy_use_hotels.pdf)) because of more cooling and a heated pool | Estimated, **higher than the only benchmark** |
| Hourly shapes (24 h curves) | morning/evening hot water peaks, 15:00 cooling peak | Typical hotel patterns (US OpenEI shapes), scaled to the totals above | Estimated |
| Hot water | 120 L per guest at +45 K | Common design value | Estimated |
| Pool heating | 15 kW summer, 80 kW winter (500 m2 pool) | Engineering estimate | Unverified |
| Occupancy | 90% summer, 50% winter | 90% is a single-day peak (mid-July 2025). ONTT: Djerba-Zarzis averaged 64.4% over Jan to Aug 2026. Recommended **85% summer, 48% winter**, see findings below | **Estimated from ONTT** (no monthly series published) |
| Season length | 150 summer days, 215 winter days | Mid-May to mid-October | Unverified |
| City factors | Sousse 0.93, Hammamet 0.90, Tozeur 1.22 (cooling) | Approximate degree-days, damped; "to verify on degreedays.net" | Estimated, **weak** |

## Check before the pitch (biggest effect on the headline numbers first)
1. ~~Gas price~~: found, STEG MP1 0.061 TND/kWh HT (see findings). Confirm on one real hotel gas bill.
2. ~~Electricity price~~: found, STEG MV tariffs (see findings). Confirm on one real hotel STEG bill.
3. **FTE subsidy**: confirm hotels qualify and the real share; it changes payback from 3.4 to 2.4 years.
4. ~~Occupancy~~: estimated from ONTT (see findings); a monthly ONTT series for Djerba would still help.
5. **Chiller cost and maintenance**: one quote from a supplier or installer would settle both.
6. **Measured Tunisian hotel data**: Mechri & Amara (2021), Energy and Buildings 241, has real Tunisian hotel consumption; we could not access it.
7. **City factors**: recompute from degreedays.net.

Demo result these feed (300 rooms, Djerba, pool, 0.352 TND/kWh): 450 kWe engine, 383 kWc chiller, 365,000 TND/yr saved, 353 t CO2/yr, payback 3.4 years (2.4 with FTE), 529 kW off the summer peak.

## Findings: STEG tariffs and Djerba occupancy (22 Nov 2026)
Primary STEG pages (steg.com.tn) could not be opened from our tools, so the tariffs below come from the investment agency's table **["Coûts des facteurs en Tunisie", FIPA-Tunisia, Jan 2024](https://investintunisia.tn/wp-content/uploads/2024/01/Couts-des-facteurs-FIPA-Janvier-2024.pdf)**, which quotes STEG directly. All prices are before VAT (HT). Units: 1 thermie = 1.163 kWh; 1 millime = 0.001 TND.

**Are these still current?** STEG's last increase was 1 May 2022, with the MV electricity rise phased in to October 2022 ([African Manager, May 2022](https://africanmanager.com/augmentation-des-tarifs-du-gaz-naturel-et-de-lelectricite-a-des-taux-variant-entre-122-et-16-pour-les-clients-residentiels-et-de-15-pour-les-industriels/)). STEG officially denied any change since 1 May 2022 on 4 May 2024 ([L'Economiste Maghrébin](https://www.leconomistemaghrebin.com/2024/05/05/augmentation-des-tarifs-de-electricite-et-du-gaz-steg-dement/)), and an Oct 2026 MV billing guide still lists the same prices ([Wattnow](https://www.wattnow.io/fr/facture-steg-moyenne-tension-guide-ligne-par-ligne/), a vendor blog). Status: **very likely current, not confirmed by STEG for 2026**. One real hotel STEG bill would confirm both.

### 1. Natural gas (STEG, in force since 1 May 2022)
| Tariff | Who | Energy price | Fixed charges |
|---|---|---|---|
| BP2 (low pressure) | 160 to 8,000 th/h, non-residential | 61.8 mill/th = 0.053 TND/kWh | flow charge |
| **MP1 (medium pressure)** | 1,000 to 4,000 th/h | **71.1 mill/th + 0.25 FTE = 0.061 TND/kWh** | 20 TND/month + 0.300 TND per th/h subscribed per month |
| MP2 | 6,000 to 30,000 th/h | 70.5 mill/th | 20 TND/month + 0.450 TND per th/h/month |

- A 450 kWe engine burns about 1,250 kW of gas (about 1,075 th/h), so the hotel lands in **MP1**. The flow charge for engine plus boiler (about 1,500 th/h) is about 450 TND/month, about 5,400 TND/yr: small next to the energy bill.
- STEG bills gas on gross calorific value (standard practice; not stated in the table). The engine efficiency (36%) is on net calorific value, so per kWh of fuel as the engine counts it, gas costs about **0.068 TND/kWh**. Use 0.068 if we keep efficiencies on LHV.
- **Recommended engine value: 0.068 TND/kWh** (MP1, HT, LHV basis). The old 0.10 was a household price with tax.

### 2. Electricity, medium voltage (STEG, in force since 1 Oct 2022)
| Tariff | Demand charge | Day | Summer morning peak | Evening peak | Night |
|---|---|---|---|---|---|
| Uniform | 5 TND/kVA/month | 291 | 291 | 291 | 291 |
| **Time-of-use (postes horaires)** | 11 TND/kW/month | 290 | 417 | 377 | 222 |

Prices in mill/kWh HT, plus 5 mill/kWh municipal surtax, plus 19% VAT. Time slots (Wattnow guide): June to August, day 06:30 to 08:30 and 13:30 to 19:00, morning peak 08:30 to 13:30, evening 19:00 to 22:00, night 22:00 to 06:30; September to May, day 07:00 to 18:00, peak 18:00 to 21:00, night 21:00 to 07:00. Sundays are billed at the night rate.
- Our 0.352 is exactly the uniform tariff with VAT: (291 + 5) x 1.19. A VAT-registered hotel recovers VAT, so the real cost is **0.296 TND/kWh**. Confirm with one hotel's accountant.
- A large hotel is usually on time-of-use. Weighting each hour the plant replaces by its slot price gives an average of **0.327 TND/kWh HT** (+5 mill surtax included), because the engine displaces mostly day and peak hours.
- **Demand charge (not modelled yet):** the time-of-use bill charges 11 TND/kW/month on a weighted power (0.4 x winter peak + 0.3 x summer peak + 0.2 x day + 0.1 x evening). Cutting these peaks is worth about **53,000 TND/yr** for the Djerba demo. Treat as upside: one engine trip during a peak hour can wipe out a month of it.

### 3. Djerba-Zarzis occupancy
| Figure | Period | Source |
|---|---|---|
| **64.4%** occupancy, 4.87 M nights (first region in Tunisia) | Jan to Aug 2026 | ONTT / Ministry of Tourism via [La Presse, 9 Oct 2026](https://fr.allafrica.com/stories/202610090697.html) |
| 80% occupancy, expected 100% from July | late June 2024 | Regional tourism commissioner via TAP ([African Manager](https://africanmanager.com/djerba-zarzis-environ-28-mille-touristes-sejournent-dans-differentes-unites-touristiques/)) |
| 90% occupancy ("record"), 32,000 hotel guests | 17 Jul 2025, one day | Regional tourism delegate ([RTCI](https://www.rtci.tn/article/687913f743e32bf02c0da1ee/tourisme--l%C3%AEle-de-djerba-affiche-un-taux-doccupation-record-de-90--selon-hichem-mahouachi), [Réalités](https://realites.com.tn/fr/djerba-affiche-des-resultats-touristiques-solides-pour-lete-2025/)) |
| 7.11 M nights, 1.19 M visitors | 1 Jan to 20 Dec 2025 | Regional tourism authorities via TAP ([Tunisie Numérique](https://www.tunisienumerique.com/djerba-zarzis-jusqua-12-000-reservations-hotelieres-attendues-pour-le-reveillon/)) |

- 90% is a peak-day snapshot, not a season average. The summer season we model (mid-May to mid-October) includes May, June, September and October, which run lower.
- ONTT does not publish a monthly Djerba series online that we could find. Annual occupancy is about 63% (Jan to Aug at 64.4%, a weaker autumn and winter). With 150 summer days at 85%, the remaining 215 days average 48%.
- **Recommended: 85% summer, 48% winter.** Note: ONTT occupancy counts open beds, and many Djerba hotels close part of the winter, so a hotel that stays open year-round may see lower winter figures.

### What this does to the Djerba demo (300 rooms, pool)
| Scenario | Engine | Chiller | Savings/yr | CO2/yr | Payback (with FTE) | Peak cut |
|---|---|---|---|---|---|---|
| Today's engine (gas 0.10, elec 0.352 with VAT, 90/50%) | 450 kWe | 383 kWc | 365,000 TND | 353 t | 3.4 (2.4) yrs | 529 kW |
| Real gas price only (0.061) | 450 kWe | 383 kWc | 477,000 TND | 353 t | 2.6 (1.8) yrs | 529 kW |
| Everything HT, uniform tariff (gas 0.068, elec 0.296), 85/48% | 450 kWe | 361 kWc | ~331,000 TND | 337 t | 3.7 (2.6) yrs | 500 kW |
| **Recommended: HT, time-of-use, gas 0.068, 85/48%** | **450 kWe** | **361 kWc** | **~389,000 TND** | **337 t** | **3.1 (2.2) yrs** | **500 kW** |
| Same, plus demand-charge saving | 450 kWe | 361 kWc | ~442,000 TND | 337 t | 2.8 (1.9) yrs | 500 kW |

How we ran it: the engine code unchanged, with only the gas price and occupancy constants swapped in a scratch copy. Time-of-use was applied by pricing each hour of reduced grid import at its slot price (summer slots on the 150 modelled summer days, winter slots on the rest; an approximation, since STEG's summer is only June to August). Rows marked ~ are derived from the engine's hourly output, not printed by the engine itself.

**Takeaway:** the two weak prices pulled in opposite directions and roughly cancelled out. Gas was too expensive (helps us) and electricity included VAT (hurts us). On a consistent before-VAT basis with real STEG tariffs and ONTT-based occupancy, the demo gives **about 390,000 TND/yr and a 3.1-year payback**, slightly better than today's headline, and the numbers are now defensible.

### Suggested engine changes (applied in engine v2, see `docs/engine/spec.md`)
1. Gas price 0.10 to **0.068** TND/kWh, source FIPA/STEG MP1.
2. Default electricity price 0.352 to **0.296** HT, and label the input "before VAT"; optionally a time-of-use mode at 0.327.
3. Occupancy 90/50 to **85/48**, source ONTT. The per-room curves in `profiles.js` were tuned to 90/50, so their comment should be updated too.
4. Optional: add the demand-charge saving as a separate "upside" line.

## Engine v2 result for the Djerba demo (22 Nov 2026)
With these tariffs **and** the critique's corrections (81% total efficiency instead of 96%, capex on the DOE curve, maintenance with overhauls, baseline chiller COP 3.5, 50% minimum load, size chosen by payback), the 300-room Djerba demo becomes **200 kWe + 64 kWc, payback 5 / 9 / 21.5 years** (favourable / central / unfavourable). The v1 450 kWe design would take about 20 years at central. The "about 390,000 TND/yr, 3.1 years" estimate above used v1's physics and capex and no longer stands. Details in `docs/engine/spec.md`.
