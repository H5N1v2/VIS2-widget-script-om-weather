// version: 0.4.0 (CSS Clock Edition for VIS2 - Full Original Content)

//////////////////////////////////////////////////
const locationName = 'locationName'; // <--- Your Location Name from Open-Meteo Adapter
//////////////////////////////////////////////////

//Vorhersage Tage/Stunden Konfiguieren - Forecast days/hours Configuration
const hourlyForecastHours = 6; // Anzahl der Stunden in der stündlichen Vorhersage (max. 16)
const dailyForecastDays = 6;    // Anzahl der Tage in der Tagesvorhersage (max. 24)

// Schriftgrößen-Konfiguration - Font Sizes Configuration
const fontSizeCurrentLabel = '1.3rem';     // "Aktuell" / Tagesname oben
const fontSizeTempBig = '3.8rem';          // Große Haupttemperatur
const fontSizeDescription = '1.1rem';      // Wetterbeschreibung
const fontSizeInfoGrid = '0.85rem';        // Info-Items
const fontSizeSunMoon = '0.8rem';          // Sonnenauf-/untergang, Wind
const fontSizeHourly = '0.75rem';          // Stündliche Vorhersage
const fontSizeHourlyRain = '0.65rem';      // Regendetails in stündlicher Vorhersage
const fontSizeForecastDay = '0.75rem';     // Tagesname in 6-Tage-Vorhersage
const fontSizeForecastText = '0.65rem';    // Wettertext in 6-Tage-Vorhersage
const fontSizeForecastTempMax = '1rem';    // Maximaltemperatur in 6-Tage-Vorhersage
const fontSizeForecastTempMin = '0.85rem'; // Minimaltemperatur in 6-Tage-Vorhersage
const fontSizeForecastDetails = '0.65rem'; // Details in 6-Tage-Vorhersage
//-----------------------------------------

const version = '0.4.0';
const dpBase = 'open-meteo-weather.0.' + locationName + '.weather';
const forecast = dpBase + '.forecast';
const targetDP = '0_userdata.0.Wetter_Widget_HTML_' + locationName;

// Sprach-Check für ioBroker
let sysLang = 'de';
try {
    const systemConfig = getObject("system.config");
    sysLang = systemConfig.common.language || 'de';
} catch (e) { sysLang = 'de'; }

// Übersetzungstabelle
const i18n = {
    de: { current: "Aktuell" }, 
    en: { current: "Current" }, 
    uk: { current: "Зараз" },
    ru: { current: "Сейчас" },
    nl: { current: "Nu" }, 
    fr: { current: "Actuel" }, 
    it: { current: "Attuale" },
    es: { current: "Actual" }, 
    pl: { current: "Aktualnie" }, 
    pt: { current: "Atual" },
    zh: { current: "当前" }
};
const lang = i18n[sysLang] || i18n['en'];

// Prüfen, ob der Datenpunkt existiert
if (!existsState(targetDP)) {
    createState(targetDP, '', {
        name: 'Weather Widget for VIS2',
        type: 'string',
        role: 'html'
    });
}

function updateWeatherWidget() {
    function getVal(id, unit = "") {
        let state = getState(id);
        if (!state || state.val === null || state.val === undefined) return "--" + unit;
        return state.val + unit;
    }

    function getImg(urlId, size = "20px", className = "") {
        let url = getVal(urlId, "");
        if (url === "" || url === "--") return ""; 
        return `<img src="${url}" style="width:${size}; height:${size}; object-fit:contain;" class="${className}">`;
    }

    const now = new Date();
    const s = now.getSeconds();
    const m = now.getMinutes();
    const h = now.getHours();

    const startSec = s * 6;
    const startMin = m * 6 + s * 0.1;
    const startHour = (h % 12) * 30 + m * 0.5;
    const digitalTimeStr = (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;

    let html = `
    <style>
        .w-container {
            font-family: 'Segoe UI', sans-serif;
            background: linear-gradient(160deg, #1e293b 0%, #0f172a 100%);
            color: #f1f5f9; padding: 20px; border-radius: 24px;
            border: 1px solid #334155; box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }
        .w-header {
            display: grid; grid-template-columns: 1.2fr 1.5fr 1fr 0.8fr;
            gap: 15px; background: rgba(255,255,255,0.05);
            padding: 20px; border-radius: 20px; margin-bottom: 20px;
            border: 1px solid rgba(255,255,255,0.1);
        }
        
        /* CSS CLOCK ANIMATION */
        .analog-clock {
            width: 120px; height: 120px; border-radius: 50%;
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            border: 4px solid rgba(56, 189, 248, 0.3);
            box-shadow: 0 0 20px rgba(56, 189, 248, 0.2), inset 0 0 20px rgba(0,0,0,0.5);
            position: relative; margin: 0 auto;
        }
        .clock-center {
            position: absolute; top: 50%; left: 50%; width: 8px; height: 8px;
            background: #fbbf24; border-radius: 50%; transform: translate(-50%, -50%);
            z-index: 10; box-shadow: 0 0 10px rgba(251, 191, 36, 0.8);
        }
        .clock-hand {
            position: absolute; bottom: 50%; left: 50%;
            transform-origin: bottom center; border-radius: 10px 10px 0 0;
        }

        @keyframes rot-s { from { transform: translateX(-50%) rotate(${startSec}deg); } to { transform: translateX(-50%) rotate(${startSec + 360}deg); } }
        @keyframes rot-m { from { transform: translateX(-50%) rotate(${startMin}deg); } to { transform: translateX(-50%) rotate(${startMin + 360}deg); } }
        @keyframes rot-h { from { transform: translateX(-50%) rotate(${startHour}deg); } to { transform: translateX(-50%) rotate(${startHour + 360}deg); } }

        .hour-hand { width: 4px; height: 30px; background: linear-gradient(to top, #fbbf24, #f87171); animation: rot-h 43200s linear infinite; transform: translateX(-50%); }
        .minute-hand { width: 3px; height: 42px; background: linear-gradient(to top, #38bdf8, #60a5fa); animation: rot-m 3600s linear infinite; transform: translateX(-50%); }
        .second-hand { width: 2px; height: 48px; background: #f87171; animation: rot-s 60s linear infinite; transform: translateX(-50%); }

        .clock-number { position: absolute; font-size: 0.7rem; font-weight: bold; color: #94a3b8; text-align: center; width: 20px; height: 20px; line-height: 20px; }
        .clock-digital { text-align: center; margin-top: 10px; font-size: 1rem; font-weight: bold; color: #38bdf8; text-shadow: 0 0 10px rgba(56, 189, 248, 0.5); }

        /* Restliche Wetter Styles */
        .w-temp-big { font-size: ${fontSizeTempBig}; font-weight: 900; color: #fbbf24; line-height: 1; }
        .w-desc { font-size: ${fontSizeDescription}; color: #38bdf8; font-weight: 600; }
        .w-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: ${fontSizeInfoGrid}; margin-top: 10px; }
        .w-info-item { background: rgba(0,0,0,0.2); padding: 6px 10px; border-radius: 10px; display: flex; align-items: center; gap: 5px; }
        .w-sun-moon { font-size: ${fontSizeSunMoon}; line-height: 1.6; border-left: 1px solid rgba(255,255,255,0.1); padding-left: 15px; }

        .w-hourly { display: grid; grid-template-columns: repeat(${hourlyForecastHours}, 1fr); gap: 8px; margin-bottom: 20px; background: rgba(0,0,0,0.15); padding: 10px; border-radius: 15px; }
        .w-h-item { text-align: center; font-size: ${fontSizeHourly}; }
        .w-h-time { font-weight: bold; color: #38bdf8; }
        .w-h-temp { font-weight: bold; color: #fbbf24; display: block; }
        .w-h-rain { font-size: ${fontSizeHourlyRain}; color: #94a3b8; }

        .w-forecast { display: grid; grid-template-columns: repeat(${dailyForecastDays}, 1fr); gap: 10px; }
        .w-fc-day { background: rgba(255,255,255,0.03); padding: 12px 8px; border-radius: 18px; text-align: center; border: 1px solid rgba(255,255,255,0.05); display: flex; flex-direction: column; justify-content: space-between; }
        .w-fc-name { font-weight: bold; color: #38bdf8; font-size: ${fontSizeForecastDay}; text-transform: uppercase; margin-bottom: 2px; }
        .w-fc-text { font-size: ${fontSizeForecastText}; color: #94a3b8; height: 2.2em; overflow: hidden; display: flex; align-items: center; justify-content: center; line-height: 1.1; margin-bottom: 5px; }
        .w-fc-temp-max { color: #f87171; font-weight: bold; font-size: ${fontSizeForecastTempMax}; display: block; }
        .w-fc-temp-min { color: #60a5fa; font-size: ${fontSizeForecastTempMin}; display: block; margin-bottom: 5px; }
        .w-fc-details { font-size: ${fontSizeForecastDetails}; color: #94a3b8; border-top: 1px solid rgba(255,255,255,0.05); margin-top: 8px; padding-top: 8px; }
        .icon-moon { filter: drop-shadow(0 0 3px #fff); }
    </style>

    <div class="w-container">
        <div class="w-header">
            <div style="text-align: center;">
                <div style="font-size: ${fontSizeCurrentLabel}; font-weight: bold;">${lang.current} / ${getVal(forecast + '.day0.name_day')}</div>
                <div style="font-size: ${fontSizeForecastDay};  font-weight: bold;"> ${(locationName)}</div>
                <div style="font-size: ${fontSizeForecastDay};  font-weight: bold;"> ${getVal(forecast + '.day0.time')}</div>
                ${getImg(dpBase + '.current.icon_url', "80px")}
                <div class="w-desc">${getVal(dpBase + '.current.weather_text')}</div>
            </div>
            <div>
                <div class="w-temp-big">${getVal(dpBase + '.current.temperature_2m', "°")}</div>
                <div style="font-weight: bold; margin-bottom: 10px;">
                    <span style="color:#f87171"> ${getVal(forecast + '.day0.temperature_2m_max', "°")}</span> | 
                    <span style="color:#60a5fa"> ${getVal(forecast + '.day0.temperature_2m_min', "°")}</span>
                </div>
                <div class="w-info-grid">
                    <div class="w-info-item">💧 ${getVal(dpBase + '.current.relative_humidity_2m', "%")}</div>
                    <div class="w-info-item">🌧️ ${getVal(forecast + '.day0.precipitation_sum', "mm")}</div>
                    <div class="w-info-item">☀️ UV ${getVal(forecast + '.day0.uv_index_max')}</div>
                    <div class="w-info-item">⏱️ ${getVal(forecast + '.day0.sunshine_duration', "h")}</div>
                </div>
            </div>
             <div class="w-sun-moon" style="position: relative;">
                🌅 ${getVal(forecast + '.day0.sunrise')}<br>
                🌇 ${getVal(forecast + '.day0.sunset')}<br>
                💨 ${getVal(dpBase + '.current.wind_direction_text')} ${getImg(dpBase + '.current.wind_direction_icon', "35px")}<br>
                <div style="margin-top:8px; display: flex; align-items: center; gap: 10px;">
                    ${getImg(forecast + '.day0.moon_phase_icon', "30px", "icon-moon")}
                    ${getImg(dpBase + '.current.wind_gust_icon', "35px")}
                </div>
                <div style="position: absolute; bottom: -10px; right: 0; font-size: 0.6rem; color: #475569; opacity: 0.8;">
                    Script Version ${version}
                </div>
              </div>
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
                <div class="analog-clock">
                    <div class="clock-number" style="top: 5px; left: 50%; transform: translateX(-50%);">12</div>
                    <div class="clock-number" style="top: 50%; right: 5px; transform: translateY(-50%);">3</div>
                    <div class="clock-number" style="bottom: 5px; left: 50%; transform: translateX(-50%);">6</div>
                    <div class="clock-number" style="top: 50%; left: 5px; transform: translateY(-50%);">9</div>
                    <div class="clock-hand hour-hand"></div>
                    <div class="clock-hand minute-hand"></div>
                    <div class="clock-hand second-hand"></div>
                    <div class="clock-center"></div>
                </div>
                <div class="clock-digital">${digitalTimeStr} Uhr</div>
            </div>
        </div>
        <div class="w-hourly">
    `;

    for (let h = 0; h <= hourlyForecastHours - 1; h++) {
        let hPath = forecast + '.hourly.next_hours.hour' + h;
        html += `
            <div class="w-h-item">
                <div class="w-h-time">${getVal(hPath + '.time')}</div>
                ${getImg(hPath + '.icon_url', "30px")}
                <span class="w-h-temp">${getVal(hPath + '.temperature_2m', "°")}</span>
                <span class="w-h-rain">
                    🌧️${getVal(hPath + '.precipitation_probability', "%")} / ${getVal(hPath + '.precipitation', "mm")}
                </span>
            </div>
        `;
    }

    html += `</div><div class="w-forecast">`;

    for (let i = 1; i <= dailyForecastDays; i++) {
        let d = forecast + '.day' + i;
        html += `
        <div class="w-fc-day">
            <div>
                <div class="w-fc-name">${getVal(d + '.name_day')}</div>
                <div class="w-fc-text">${getVal(d + '.weather_text')}</div>
                ${getImg(d + '.icon_url', "45px")}
                <span class="w-fc-temp-max">${getVal(d + '.temperature_2m_max', "°")}</span>
                <span class="w-fc-temp-min">${getVal(d + '.temperature_2m_min', "°")}</span>
            </div>
            <div class="w-fc-details">
                🌧️ ${getVal(d + '.precipitation_sum', "mm")} (${getVal(d + '.precipitation_probability_max', "%")})<br>
                💧 ${getVal(d + '.relative_humidity_2m_mean', "%")}<br>
                ☀️ ${getVal(d + '.sunshine_duration', "h")}<br>
                <div style="margin-top:5px; display: flex; justify-content: center; gap: 4px;">
                    ${getImg(d + '.moon_phase_icon', "18px", "icon-moon")}
                    ${getImg(d + '.wind_direction_icon', "18px")}
                    ${getImg(d + '.wind_gust_icon', "22px")}
                </div>
            </div>
        </div>
        `;
    }

    html += `</div></div>`;
    
    setState(targetDP, html, true);
}

// Start & Trigger
updateWeatherWidget();
// Jede Minute triggern für die Uhr
schedule("*/1 * * * *", updateWeatherWidget);

on({id: dpBase + '.current.temperature_2m', change: 'any'}, updateWeatherWidget);
on({id: forecast + '.hourly.next_hours.hour0.time', change: 'any'}, updateWeatherWidget);