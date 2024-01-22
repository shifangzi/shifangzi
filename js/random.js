$(document).ready(() => {
    $("#shortcut_random_yao").click(function () {
        let randomYao = frequentlyUsedYaoDict[getRandomInt(frequentlyUsedYaoDict.length)];
        display(randomYao);
    });

    $("#shortcut_random_fang").click(function () {
        let randomFang = fangDict[getRandomInt(fangDict.length)];
        display(randomFang.name);
    });

    $("#shortcut_random_jingluo").click(function () {
        let randomJingluo = jingluoDict[getRandomInt(jingluoDict.length)];
        display(randomJingluo.name);
    });
});

function display(result)
{
    $("#warning_message").html(result);
}

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}