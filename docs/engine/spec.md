# Sizing engine v2: spec and results

Reference model: `engine/model.mjs` (plain ES module, no dependencies). Tests: `node --test engine/*.test.mjs`. The TypeScript port for the website (ADR 0002) must pass the same tests.

v2 applies the critique (`critique/idea-critique.md` in the project files) and the real STEG and ONTT figures (`docs/research/assumptions-audit.md`, findings section). Every parameter, with all three values and its source, is in `PARAMS` in the code and is returned in `assumptions`.

## What changed from v1, and why
| # | v1 | v2 | Why |
|---|---|---|---|
| 1 | 36% electrical + 1.67 kWth/kWe = **96% total** | Electrical 38% + thermal 43% = **81%** (LHV), test enforces ≤ 85% | v1's energy balance broke physics. Real engines reach 75-85% (DOE). |
| 2 | Engine 2,000 TND/kWe flat, chiller 900 TND/kWc | Engine 7,000 TND/kWe at 500 kWe (range 5,000-9,100), scaled with size along the DOE curve; chiller 3,000 TND/kWc (2,000-4,500) | 2,000 is a fleet average of multi-MW industrial plants. DOE installed cost for 500 kW is $3,150/kW, about 9,100 TND. |
| 3 | Maintenance 0.02 TND/kWh | 0.04 (0.03-0.058), overhauls included | DOE non-fuel O&M is 2.0 US cents/kWh at 500 kW (0.058 TND). |
| 4 | Gas 0.10 TND/kWh (household price with VAT) | 0.068 TND/kWh LHV (STEG MP1, before VAT); 0.09 in the unfavourable case | Real STEG tariff; the unfavourable case allows for subsidy reform. |
| 5 | Flat 0.352 TND/kWh (includes 19% VAT) | STEG MV time-of-use, hour by hour, before VAT; demand-charge saving counted only in the favourable case | Real tariff structure. The flat-price input is still accepted. |
| 6 | Baseline chiller COP 3.0 | 3.5 (3.0-4.5) | 3.0 flatters the plant; newer chillers do better. |
| 7 | No parasitics, engine runs at any load | Absorption pumps and tower fans 0.03 kWe/kWc; engine switches off below 50% load | Real plant limits. This is what exposes winter idling. |
| 8 | Occupancy 90% / 50% | 85% / 48% (80/40 to 90/55) | ONTT: Djerba-Zarzis 64.4% for Jan to Aug 2026. |
| 9 | Engine sized at the 30th-percentile summer heat hour | Sweeps 100 to 1,000 kWe and keeps the shortest central payback; reports the best option overall and the best **trigeneration** option (chiller ≥ 50 kWc) | A summer-sized engine idles all winter. |
| 10 | One number per output | Unfavourable / central / favourable, rounded; plus full-load hours, primary energy saving (EU method), verdict, warnings | The model does not have the precision a single number implies. |

Scenarios are combinations a sceptical juror (unfavourable) or an enthusiastic installer (favourable) would pick. They are not statistical bounds. The FTE subsidy (30%) is still **unconfirmed** for hotels and is shown only as a separate "with FTE" payback.

## Djerba demo, 300 rooms, pool (STEG time-of-use, before VAT)
| Option | Plant | Capex | Savings/yr | Payback | With FTE (unconfirmed) | CO2 avoided | Full-load hours |
|---|---|---|---|---|---|---|---|
| **Trigeneration (headline)** | 200 kWe + 64 kWc | 1.2 / 1.75 / 2.4 M TND | 260k / 200k / 110k TND | **5 / 9 / 21.5 yrs** | 3.5 / 6 / 15 yrs | 260 / 210 / 70 t | 6,100 / 5,700 / 4,900 |
| Best of any size (CHP, hot water and pool only) | 100 kWe, no chiller | 0.6 / 0.85 / 1.1 M TND | 135k / 110k / 70k TND | **4.5 / 7.5 / 15.5 yrs** | 3 / 5.5 / 11 yrs | 150 / 130 / 60 t | 6,600 / 6,600 / 6,500 |
| v1 design re-run in v2 (central) | 450 kWe | about 3.9 M TND | about 190k TND | **about 20 yrs** | | | 2,400 |

Read as favourable / central / unfavourable. Peak grid relief: about 220 kW for the trigeneration option, if the engine is running at the peak hour (no N-1 margin).

Compared with v1's headline (450 kWe + 383 kWc, 365,000 TND/yr, 3.4-year payback), the central case is now **9 years**, on a plant half the size.

### Why the plant got smaller
In winter the 300-room hotel at 48% occupancy needs only about 90 to 190 kW of electricity. A 450 kWe engine following that load sits below its 50% minimum and switches off for most of the 215 winter days, so it makes only about 2,400 full-load hours a year. A 200 kWe engine runs about 5,700 hours. Smaller engines also need little cooling heat, so the absorption chiller shrinks to 64 kWc: most of the recovered heat goes to hot water and the pool all year.

### What moves the central 9-year payback most (one input at a time, unfavourable / favourable)
| Input | Payback |
|---|---|
| Engine capex (9,100 / 5,000 TND/kWe) | 11.3 / 6.6 yrs |
| Gas price (0.09 / 0.068) | 10.9 / 8.9 yrs |
| Winter occupancy (40% / 55%) | 9.9 / 8.5 yrs |
| Maintenance (0.058 / 0.03) | 9.9 / 8.4 yrs |
| Demand-charge saving (not counted / counted) | 8.9 / 7.8 yrs |
| Engine efficiency | 9.6 / 8.5 yrs |
| Chiller capex, chiller COPs, occupancy in summer | ±0.5 yr or less |

**One installer quote matters more than every other input combined.**

### Other hotels (central case, headline option)
| Hotel | Plant | Payback (fav / central / unfav) | Verdict |
|---|---|---|---|
| 100 rooms, Djerba | 150 kWe + 77 kWc | 10.5 / 22.5 / 64.5 yrs | weak fit (2,400 full-load hours) |
| 300 rooms, Tozeur | 200 kWe + 52 kWc | 4.5 / 8.5 / 20.5 yrs | possible fit, needs a study |
| 500 rooms, Djerba | 300 kWe + 81 kWc | 4.5 / 8 / 19 yrs | possible fit, needs a study |

## What this means for the pitch
- The honest central case is **8 to 9 years** for a 300-500-room Djerba hotel, with a 5-year favourable case. That is in line with our own research, which said plants under 500 kW pay back in 10 to 15 years.
- The value is **year-round hot water and pool heat**, not summer cooling. For seasonal hotels, a small CHP unit is the better first step, and the absorption chiller is an add-on.
- This supports the critique's reframe: the tool is a **screening tool** that tells most hotels "not yet" and finds the few where it pays (large, open all year, heated pool or spa, gas connection).

## Not modelled yet
Island mode for blackouts, a chilled-water retrofit for hotels on split units, the gas connection itself (no-gas sites), water use of the cooling tower, derating above 40 °C, part-load efficiency curves, an 8,760-hour simulation, NPV/IRR with price escalation, a PV-plus-efficient-chiller comparison.
