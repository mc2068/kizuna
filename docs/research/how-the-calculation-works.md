# How the sizing tool calculates results for a hotel

> Describes engine **v1**. v2 (`engine/model.mjs`, `docs/engine/spec.md`) changes the energy balance, capex, prices, sizing rule and shows ranges; the worked numbers below are v1 only.

Source: `site/js/engine.js` and `site/js/profiles.js` in mc2068/kizuna-trigeneration. Worked example: 300 rooms, Djerba, pool, electricity 0.352 TND/kWh.

## 1. Build the hotel's hourly demand (two typical days: summer and winter)
- Start from a fixed "typical Tunisian 4-star room": 24 hourly values for electricity, hot water/heating, and cooling, for one summer day and one winter day.
- Multiply by occupied rooms: rooms x occupancy (90% summer, 50% winter). Djerba summer: 300 x 0.9 = 270 occupied rooms.
- Apply the city factor: cooling x1.00 Djerba, 0.93 Sousse, 0.90 Hammamet, 1.22 Tozeur; heat x1.00 / 1.09 / 1.15 / 1.15.
- Add pool heating if there is a pool, scaled by rooms / 300.
- Example at 15:00 on a summer day: 281 kW electricity, 142 kW heat, 745 kW cooling.

## 2. Size the engine
- Total heat the hotel could use in each summer hour = hot water + cooling / 0.7 (the absorption chiller needs 1/0.7 units of heat per unit of cold).
- Take the 30th-percentile hour (a "base load" hour, not the peak) so the engine runs full most of the time instead of idling.
- Divide by 1.67 kW of heat per kW of electricity, round up to the next 50 kW, minimum 100 kW.
- Example: 712 kW of heat / 1.67 = 427, rounded up to **450 kWe**.

## 3. Simulate every hour of both days
- The engine runs 06:00 to 24:00 and follows the hotel's electricity need, never exporting.
- Its waste heat goes to hot water first; what's left drives the absorption chiller.
- Remaining cooling comes from the existing electric chillers (COP 3), remaining heat from the gas boiler (92%), remaining electricity from STEG.
- The chiller size is the most cooling it delivers in any summer hour: **383 kWc**.
- Example at 15:00: engine 405 kW, chiller 374 kWc, grid import 0.

## 4. Turn the two days into a year
- Summer day x 150 days + winter day x 215 days.
- Baseline (today): all electricity from STEG (lights + electric chillers) and a gas boiler for hot water.
- With the plant: grid import + engine gas + boiler gas + maintenance (0.02 TND per kWh made).
- **Savings** = baseline cost - new cost = **365,000 TND/yr**.
- **CO2 avoided** = baseline emissions (grid 0.48, gas 0.202 kg/kWh) - new emissions = **353 t/yr**.

## 5. Payback and peak cut
- Investment = engine x 2,000 TND/kW + chiller x 900 TND/kW = 450 x 2,000 + 383 x 900 = about 1.24 million TND.
- **Payback** = investment / savings = **3.4 years**; with a 30% FTE grant = **2.4 years**.
- **Peak cut** = at the hottest summer hour, what the hotel draws from STEG today minus what it draws with the plant = **529 kW**.

## What's specific to each hotel, and what's generic
- Specific (the 4 inputs): number of rooms, city, pool, electricity price.
- Generic (same for every hotel): the per-room hourly curves, occupancy, season lengths, gas price, equipment efficiencies and costs, CO2 factors.
- So two 300-room Djerba hotels with pools get identical results, even if one is a 5-star with a spa. A real feasibility study replaces the generic curves with the hotel's own STEG bills and meter data.

## Other examples (pool, 0.352 TND/kWh)
| Hotel | Engine | Chiller | Savings/yr | CO2/yr | Payback (with FTE) | Peak cut |
|---|---|---|---|---|---|---|
| 100 rooms, Djerba | 150 kWe | 128 kWc | 122,000 TND | 118 t | 3.4 (2.4) yrs | 176 kW |
| 300 rooms, Hammamet | 450 kWe | 351 kWc | 365,000 TND | 366 t | 3.3 (2.3) yrs | 504 kW |
| 300 rooms, Tozeur | 550 kWe | 416 kWc | 392,000 TND | 382 t | 3.8 (2.6) yrs | 584 kW |
