# Where the sizing tool's numbers come from

Audit of every constant in the old engine (`site/js/engine.js`, `site/js/profiles.js`, `docs/method.md` in mc2068/kizuna-trigeneration), 22 Nov 2026.
Status: **Sourced** = a published figure used as-is; **Estimated** = derived from a source with our own rounding or reasoning; **Unverified** = team assumption with no source yet.

## Prices and money
| Assumption | Value | Basis | Status |
|---|---|---|---|
| Business electricity price (tool default, user can change) | 0.352 TND/kWh | [GlobalPetrolPrices, Tunisia business electricity](https://www.globalpetrolprices.com/Tunisia/electricity_prices/) | Sourced, but an aggregator, not the STEG tariff |
| Natural gas price | 0.10 TND/kWh | Household gas 0.092 TND/kWh ([GlobalPetrolPrices, Jun 2025](https://www.globalpetrolprices.com/Tunisia/natural_gas_prices/)), rounded up; commercial tariff not found | Estimated, **weak** |
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
| Occupancy | 90% summer, 50% winter | Team brief; ONTT statistics not used | Unverified, **weak** |
| Season length | 150 summer days, 215 winter days | Mid-May to mid-October | Unverified |
| City factors | Sousse 0.93, Hammamet 0.90, Tozeur 1.22 (cooling) | Approximate degree-days, damped; "to verify on degreedays.net" | Estimated, **weak** |

## Check before the pitch (biggest effect on the headline numbers first)
1. **Gas price**: savings depend mostly on the electricity/gas price gap. Get the STEG commercial or hotel gas tariff.
2. **Electricity price**: confirm the STEG medium-voltage hotel tariff (and peak-hour rate) instead of an aggregator.
3. **FTE subsidy**: confirm hotels qualify and the real share; it changes payback from 3.4 to 2.4 years.
4. **Occupancy and season**: replace with ONTT figures for Djerba.
5. **Chiller cost and maintenance**: one quote from a supplier or installer would settle both.
6. **Measured Tunisian hotel data**: Mechri & Amara (2021), Energy and Buildings 241, has real Tunisian hotel consumption; we could not access it.
7. **City factors**: recompute from degreedays.net.

Demo result these feed (300 rooms, Djerba, pool, 0.352 TND/kWh): 450 kWe engine, 383 kWc chiller, 365,000 TND/yr saved, 353 t CO2/yr, payback 3.4 years (2.4 with FTE), 529 kW off the summer peak.
