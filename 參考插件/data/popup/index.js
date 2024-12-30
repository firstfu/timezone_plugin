
const offset = document.getElementById('offset');
const toast = document.getElementById('toast');

offset.addEventListener('change', () => {
    const value = offset.selectedOptions[0].value;

    chrome.runtime.sendMessage({
        op: "Analyze",
        value,
    }, res => {
        if (!res) { return; }
        const { offset, storage } = res;

        document.getElementById('minutes').value = offset;
        document.getElementById('daylight').value = storage.msg.daylight || storage.msg.standard;
        document.getElementById('standard').value = storage.msg.standard;
    });
});

document.addEventListener('DOMContentLoaded', async () => {
    const f = document.createDocumentFragment();
    Object.keys(offsets).sort((a, b) => offsets[b].offset - offsets[a].offset).forEach(key => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = `${key} (${offsets[key].offset})`;
        f.appendChild(option);
    });
    offset.appendChild(f);

    const storage = await chrome.storage.local.get();
    const getStorage = (key) => storage[key];

    offset.value = getStorage('location') || 'Etc/GMT';

    document.getElementById('standard').value = getStorage('standard') || 'London Standard Time';
    document.getElementById('daylight').value = getStorage('daylight') || 'London Daylight Time';
    document.getElementById('minutes').value = getStorage('offset') || 0;
    document.getElementById('random').checked = getStorage('random') === 'true';
    document.getElementById('update').checked = getStorage('update') === 'true';
});

document.addEventListener('submit', e => {
    e.preventDefault();

    (async () => {
        await chrome.storage.local.set({
            location: offset.value,
            offset: document.getElementById('minutes').value,
            daylight: document.getElementById('daylight').value,
            standard: document.getElementById('standard').value,
            random: document.getElementById('random').checked ? "true" : null,
            update: document.getElementById('update').checked ? "true" : null,
        });

        toast.textContent = 'Options saved';
        globalThis.setTimeout(() => toast.textContent = '', 750);
    })();
});



// reset
document.getElementById('reset').addEventListener('click', e => {
    chrome.runtime.sendMessage({
        op: "Reset",
    }, () => {
        document.querySelector("[value='Etc/GMT']").selected = true;
        
        globalThis.location.reload();
    });
});
