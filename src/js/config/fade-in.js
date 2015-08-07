export default function (el) {
    let opacity = 0;

    el.style.opacity = 0;

    if (el.style.display == "none") {
        el.style.display = "block";
    }

    el.style.filter = '';

    let last = +new Date();
    let tick = function () {
        opacity += (new Date() - last) / 400;
        el.style.opacity = opacity;
        el.style.filter = `alpha(opacity="${(100 * opacity) | 0}")`;

        last = +new Date();

        if (opacity < 1) {
            (window.requestAnimationFrame && requestAnimationFrame(tick)) || setTimeout(tick, 16);
        }
    };

    tick();
}