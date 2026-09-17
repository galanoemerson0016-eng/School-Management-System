function c(n){const r=n.match(/LRN:\s*([\w-]+)/i),t=(r?r[1]:n).trim();return/^\d{12}$/.test(t)||t.startsWith("TEMP-")?t:""}export{c as e};
