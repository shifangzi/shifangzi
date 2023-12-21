const matchThreshold = 0.75; // the percentage of Yao matched at least
const defaultDisplayedFang = 5;
const nonHanziRegex = /[^\u4e00-\u9fa5䗪]+/g

$(document).ready(() => {
    $("#search_input").focus();

    let randomTip = tipDict[getRandomInt(tipDict.length)];
    $("#info_message").append(`<i>Tip: ${randomTip}</i></br>`);

    $('input').keyup(function (e) {
        if (e.keyCode == 13) {
            analyze();
        }
    });

    $("#shortcut_clear").click(function () {
        $("#search_input").val("");
        analyze();
        $("#search_input").focus();
    });

    $("#shortcut_delete").click(function () {
        let yaoInputList = getYaoInputArr();

        if (yaoInputList.length > 0) {
            yaoInputList.pop();
            $("#search_input").val(yaoInputList.join(" "));
            analyze();
        }
    });

    $("#shortcut_select_all").click(function () {
        highlightYaoByYaoArr(getYaoInputArr());
    });

    $("#shortcut_random_yao").click(function () {
        let randomYao = frequentlyUsedYaoDict[getRandomInt(frequentlyUsedYaoDict.length)];
        $("#search_input").val(randomYao);
        analyze();
    });

    $("#shortcut_random_yaodui").click(function () {
        let highlightedYaoArr = getHighlightedYaoArr();

        const filteredDict = highlightedYaoArr.length > 0
            ? yaoduiDict.filter(x => highlightedYaoArr.every(y => x.arr.indexOf(y) >= 0))
            : yaoduiDict;

        if (filteredDict.length == 0) {
            return;
        }

        let randomInt = getRandomInt(filteredDict.length);
        let randomYaodui = filteredDict[randomInt];
        let inputList = getYaoInputArr();
        if (inputList.length == randomYaodui.arr.length && inputList.every(x => randomYaodui.arr.indexOf(x) >= 0)) {
            randomInt = (randomInt + 1) % filteredDict.length;
            randomYaodui = filteredDict[randomInt];
        }
        $("#search_input").val(randomYaodui.arr.join(" "));

        analyze();
        highlightYaoByYaoArr(highlightedYaoArr);
    });

    $("#shortcut_random_fang").click(function () {
        let highlightedYaoArr = getHighlightedYaoArr();

        const filteredDict = highlightedYaoArr.length > 0
            ? fangDict.filter(x => highlightedYaoArr.every(y => x.arr.map(z => z.yao).indexOf(y) >= 0))
            : fangDict;

        if (filteredDict.length == 0) {
            return;
        }

        let randomInt = getRandomInt(filteredDict.length);
        let randomFang = filteredDict[randomInt];
        if ($("#search_fang_name").html() == randomFang.name) {
            randomInt = (randomInt + 1) % filteredDict.length;
            randomFang = filteredDict[randomInt];
        }
        $("#search_input").val(randomFang.name);

        analyze();
        highlightYaoByYaoArr(highlightedYaoArr);
    });
});

function analyze() {
    let usageWrapper = $("#usage_wrapper");
    let warningMessageWrapper = $("#warning_message");
    let infoMessageWrapper = $("#info_message");
    let jinsifangWrapper = $("#jinsifang_wrapper");
    let yaoduiWrapper = $("#yaodui_wrapper");
    let wuweiWrapper = $("#wuwei_wrapper");
    let siqiWrapper = $("#siqi_wrapper");
    let shengjiangWrapper = $("#shengjiang_wrapper");
    let guijingWrapper = $("#guijing_wrapper");

    let searchInput = $("#search_input");
    let currentSearchInput = $("#current_search_input");

    if (searchInput.val().trim() == "") {
        currentSearchInput.val("");

        usageWrapper.hide();
        warningMessageWrapper.empty();
        infoMessageWrapper.empty();
        jinsifangWrapper.empty();
        yaoduiWrapper.empty();
        wuweiWrapper.empty();
        siqiWrapper.empty();
        shengjiangWrapper.empty();
        guijingWrapper.empty();

        return;
    }

    let yaoInputList = searchInput.val().replace(nonHanziRegex, ",").split(",");

    if (yaoInputList.length > 20) {
        warningMessageWrapper.empty();
        warningMessageWrapper.append(`<div>药味数太多，最多允许20</div>`);

        return;
    }

    let searchFangName = "";
    let searchFangSrc = "";
    // Search by Fang first if there is only one input
    if (yaoInputList.length == 1) {
        let indexOfSplit = yaoInputList[0].indexOf("出自");
        let fangObj = indexOfSplit > 0
            ? fangDict.find(f => f.name == yaoInputList[0].substring(0, indexOfSplit) && f.src.replace(nonHanziRegex, "") == yaoInputList[0].substring(indexOfSplit + 2))
            : fangDict.find(f => f.name == yaoInputList[0]);
        if (!fangObj) {
            fangAliasObj = fangAliasDict.find(fa => fa.alias == yaoInputList[0]);
            if (!!fangAliasObj) {
                fangObj = fangDict.find(f => f.name == fangAliasObj.fang);
            }
        }

        if (!!fangObj) {
            searchFangName = fangObj.name;
            searchFangSrc = indexOfSplit > 0 ? yaoInputList[0].substring(indexOfSplit + 2) : "";
            yaoInputList = fangObj.arr.map(x => x.yao);
        }
    }

    /* Initialize arrays */
    let unknownYaoList = []; // type of str[]
    let uniqueYaoList = []; // type of str[]
    let aliasYaoList = []; // type of str[]
    let jinsifangList = []; // type of { name: str, source: str, percentage: number, arr: { yao: str, pz: str, yl: str, isMatched: boolean, jczs: str}[]}[]
    let yaoduiList = []; //type of { arr: str[], gx: str, cf: str }[]
    let wuweiList = [
        { "name": "酸", "arr": [] },
        { "name": "微酸", "arr": [] },
        { "name": "苦", "arr": [] },
        { "name": "微苦", "arr": [] },
        { "name": "甘", "arr": [] },
        { "name": "微甘", "arr": [] },
        { "name": "辛", "arr": [] },
        { "name": "微辛", "arr": [] },
        { "name": "咸", "arr": [] },
        { "name": "淡", "arr": [] },
        { "name": "涩", "arr": [] }
    ];
    let siqiList = [
        { "name": "大寒", "arr": [] },
        { "name": "寒", "arr": [] },
        { "name": "微寒", "arr": [] },
        { "name": "凉", "arr": [] },
        { "name": "平", "arr": [] },
        { "name": "微温", "arr": [] },
        { "name": "温", "arr": [] },
        { "name": "热", "arr": [] },
        { "name": "大热", "arr": [] }
    ];
    let shengjiangList = [
        { "name": "升浮", "arr": [] },
        { "name": "沉降", "arr": [] },
        { "name": "双重趋向", "arr": [] }
    ];
    let guijingList = []; // type of { name: str, arr: str[] }

    yaoInputList.forEach(yao => {
        if (uniqueYaoList.indexOf(yao) >= 0) {
            return true;
        }

        let yaoObj = yaoDict.find(x => x.name == yao);
        if (!yaoObj) {
            // Check alias dictionary
            let aliasObj = yaoAliasDict.find(x => x.alias == yao);
            if (!!aliasObj) {
                yao = aliasObj.yao;
                yaoObj = yaoDict.find(x => x.name == yao);
                if (aliasYaoList.indexOf(aliasObj.alias) < 0) {
                    aliasYaoList.push(aliasObj);
                }
            }
            else {
                if (!!yao && unknownYaoList.indexOf(yao.substring(0,9)) < 0) {
                    unknownYaoList.push(yao.substring(0,9));
                }
                return true;
            }
        }

        uniqueYaoList.push(yao);

        yaoObj.wuwei.forEach(ww => {
            let wuweiObj = wuweiList.find(x => x.name == ww);
            if (!wuweiObj) {
                wuweiList.push({ "name": ww, "arr": [yao] });
            }
            else {
                wuweiObj.arr.push(yao);
            }
        });

        let siqiObj = siqiList.find(x => x.name == yaoObj.siqi);
        if (!siqiObj) {
            siqiList.push({ "name": yaoObj.siqi, "arr": [yao] });
        }
        else {
            siqiObj.arr.push(yao);
        }

        let shengjiangObj = shengjiangList.find(x => x.name == yaoObj.shengjiang);
        if (!shengjiangObj) {
            shengjiangList.push({ "name": yaoObj.shengjiang, "arr": [yao] });
        }
        else {
            shengjiangObj.arr.push(yao);
        }

        yaoObj.guijing.forEach(gj => {
            let yaoObj = guijingList.find(x => x.name == gj);
            if (!yaoObj) {
                guijingList.push({ "name": gj, "arr": [yao] });
            }
            else {
                yaoObj.arr.push(yao);
            }
        });
    });

    searchInput.val(uniqueYaoList.join(" "));
    if (!!searchFangName) {
        currentSearchInput.val(searchFangName + (!!searchFangSrc ? "出自" + searchFangSrc : ""));
    }
    else {
        currentSearchInput.val(uniqueYaoList.join(" "));
    }

    /* 近似方 */
    fangDict.forEach(f => {
        let junLength = f.arr.filter(x => x.jczs == "j").length;

        if (uniqueYaoList.length < (f.arr.length + junLength) * matchThreshold - junLength) {
            return true;
        }

        let maxAllowedUnmatch = Math.floor(precisionRound((f.arr.length + junLength) * (1 - matchThreshold), 1));

        let countOfUnmatched = 0;
        let countOfMatched = 0;

        let checkedYaoList = [];
        f.arr.forEach(y => {
            let isMatched = uniqueYaoList.indexOf(y.yao) >= 0;
            if (!isMatched) {
                countOfUnmatched++;
                if (countOfUnmatched > maxAllowedUnmatch) {
                    return true;
                }
            }
            else {
                countOfMatched += y.jczs == "j" ? 2 : 1;
            }

            checkedYaoList.push({ "yao": y.yao, "pz": y.pz, "yl": y.yl, "jczs": y.jczs, "isMatched": isMatched });
        });

        let matchPercentage = precisionRound((countOfMatched) / (f.arr.length + junLength), 2)

        if (matchPercentage >= matchThreshold) {
            jinsifangList.push({ "name": f.name, "source": f.src, "yf": f.yf, "zz": f.zz, "bj": f.bj, "percentage": matchPercentage, "arr": checkedYaoList });
        }
    });

    /* 药对 */
    yaoduiDict.forEach(yd => {
        if (yd.arr.every(x => uniqueYaoList.indexOf(x) >= 0)) {
            yaoduiList.push({ "arr": yd.arr, "gx": yd.gx, "cf": yd.cf, "pri": yd.pri });
        }
    });

    /* UI Render */
    usageWrapper.hide();
    warningMessageWrapper.empty();
    infoMessageWrapper.empty();
    jinsifangWrapper.empty();
    yaoduiWrapper.empty();
    wuweiWrapper.empty();
    siqiWrapper.empty();
    shengjiangWrapper.empty();
    guijingWrapper.empty();

    if (unknownYaoList.length > 0) {
        warningMessageWrapper.append(`<span>未知药${unknownYaoList.length == 1 && uniqueYaoList.length == 0 ? "或方" : ""}: ${unknownYaoList.join("、")}</span>`);
        warningMessageWrapper.append("<br/>");
    }

    if (aliasYaoList.length > 0) {
        warningMessageWrapper.append(`<span>非规范药名(已更正): ${aliasYaoList.map((x) => x.alias + "→" + x.yao).join("、")}</span>`);
        warningMessageWrapper.append("<br/>");
    }

    if (!!searchFangName) {
        infoMessageWrapper.append(`<span>查方: </span><span id="search_fang_name">${searchFangName}</span>`);
        let fangWithSameNameObj = fangWithSameNameDict.find(x => x.fang == searchFangName);
        if (!!fangWithSameNameObj) {
            infoMessageWrapper.append(`<span>，此方有不同配伍版本</span>`);
            fangWithSameNameObj.srcArr.forEach(fwsn => {
                infoMessageWrapper.append(`<br/><span class="fangming" onclick="triggerFangSearch('${fangWithSameNameObj.fang}出自${fwsn.replace(nonHanziRegex, "")}')">${fwsn}<span>`);
            });
        }
        infoMessageWrapper.append("<br/>");
    }
    else if (uniqueYaoList.length > 0) {
        infoMessageWrapper.append(`<span>组方，共${uniqueYaoList.length}味</span>`);
    }

    if (jinsifangList.length > 0) {
        jinsifangList.sort((a, b) => {
            if (a.percentage == 1 && a.name == searchFangName) {
                return -1;
            }

            if (b.percentage == 1 && b.name == searchFangName) {
                return 1;
            }

            if (a.percentage > b.percentage) {
                return -1;
            }
            else if (a.percentage < b.percentage) {
                return 1;
            }
            else if (a.arr.length > b.arr.length) {
                return -1;
            }
            else {
                return 0;
            }
        });

        for (let i = 0; i < jinsifangList.length; i++) {
            const jsf = jinsifangList[i];
            jinsifangWrapper.append(`<div class="fang-inner-wrapper ${i >= defaultDisplayedFang ? "hidden" : ""}" data-sequence="${i}"></div>`);
            let innerWrapper = jinsifangWrapper.children().last();
            innerWrapper.append(`<span class="fangming" onclick="triggerSearch(this)">${jsf.name}</span><span> ${jsf.source.indexOf("《") < 0 ? "《" : ""}${jsf.source}${jsf.source.indexOf("《") < 0 ? "》" : ""} ${Math.round(jsf.percentage * 100)}%</span>`);
            
            let innerFangObj = fangInnerDict.find(x => x.fang == jsf.name);
            let innerYaoArr = [];
            let yaoHead = "";
            let yaoBody = "";
            let yaoTail = "";
            if (!!innerFangObj)
            {
                innerFangObj.arr.forEach(f => f.arr.forEach(y => innerYaoArr.push({"yao": y, "isMatched": false})));
            }
            
            jsf.arr.forEach(jsfy => {
                let innerYaoObj = innerYaoArr.find(x => x.yao == jsfy.yao);
                if (!innerYaoObj) {
                    yaoBody += `<span class=\"yao ${jsfy.isMatched ? "highlighted" : ""} ${jsfy.jczs == "j" ? "jun" : ""}\">${jsfy.yao}</span><span class="sub">${jsfy.pz}${jsfy.yl}</span>`;
                }
                else {
                    innerYaoObj.isMatched = jsfy.isMatched;
                }
            })

            if (!!innerFangObj)
            {
                innerFangObj.arr.forEach(f => {
                    let yaoStr = "";
                    let isInnerFangMatched = true;
                    for (let j = 0; j < f.arr.length; j++) {
                        let innerYaoObj = innerYaoArr.find(x => x.yao == f.arr[j]);
                        yaoStr += `<span class=\"sub ${innerYaoObj.isMatched ? "highlighted" : ""}">${(j==0? "":" ") + innerYaoObj.yao}</span></span>`;
                        isInnerFangMatched &= innerYaoObj.isMatched;
                    }
                    yaoStr = `<span class=\"yao ${isInnerFangMatched ? "highlighted" : ""}\">${f.fang}</span><span class=\"sub\">(</span>` + yaoStr;
                    yaoStr += `<span class=\"sub\">)${f.remark}</span>`;
                    
                    if (f.pos == "H") {
                        yaoHead += yaoStr;
                    }
                    else {
                        yaoTail += yaoStr;
                    }
                });
            }

            innerWrapper.append(yaoHead + yaoBody + yaoTail);

            if (!!jsf.yf) {
                innerWrapper.append(`<br/><span class="sub">[用法] ${jsf.yf}`);
            }
            if (!!jsf.zz) {
                innerWrapper.append(`<br/><span class="sub">[主治] ${jsf.zz}`);
            }
            if (!!jsf.bj) {
                innerWrapper.append(`<br/><span class="sub">[病机] ${jsf.bj}`);
            }
        }

        if (jinsifangList.length > defaultDisplayedFang) {
            jinsifangWrapper.append(`<div class="loadmore-wrapper" onclick="loadMoreOrLessFang(this)"><img class="loadmore" src="image/loadmore.svg"></div>`);
        }
    }

    if (uniqueYaoList.length > 0 && (jinsifangList.length == 0 || jinsifangList[0].percentage < matchThreshold)) {
        usageWrapper.html(`仅罗列药味匹配度超过${matchThreshold * 100}%的方`).show();
    }

    // if there is a Fang highly matched, adjust Yaodui order pri by Fang
    if (jinsifangList.length > 0 && jinsifangList[0].percentage >= 0.8) {
        let jsf = jinsifangList[0];
        yaoduiList.forEach(yd => {
            if (yd.cf == jsf.name) {
                yd.pri += 10;
            }

            yd.arr.forEach(ydy => {
                for (i = 0; i < jsf.arr.length; i++) {
                    if (ydy == jsf.arr[i].yao && jsf.arr[i].jczs == "j") {
                        yd.pri += 3;
                    }
                }
            });
        });
    }

    yaoduiList.sort((a, b) => {
        if (a.pri > b.pri) {
            return -1;
        }
        else if (a.pri < b.pri) {
            return 1;
        }
        else {
            return 0;
        }
    });

    yaoduiList = yaoduiList.slice(0, 3);

    yaoduiList.forEach(yd => {
        yaoduiWrapper.append(`<span class="yd" onclick=highlightYaodui(this)>${yd.arr.join("+")}--${yd.gx}--${yd.cf}</span>`);
        yaoduiWrapper.append("<br/>");
    });

    wuweiList.forEach(ww => {
        if (ww.arr.length > 0) {
            wuweiWrapper.append(`<span>${ww.name}：${ww.arr.map(x => "<span class=\"yw\" onclick=highlightYaoWithSameName(this)>" + x + "</span>").join("、")}`);
            wuweiWrapper.append("<br/>");
        }
    });

    siqiList.forEach(sq => {
        if (sq.arr.length > 0) {
            siqiWrapper.append(`<span>${sq.name}</span>：${sq.arr.map(x => "<span class=\"yw\" onclick=highlightYaoWithSameName(this)>" + x + "</span>").join("、")}`);
            siqiWrapper.append("<br/>");
        }
    });

    shengjiangList.forEach(sj => {
        if (sj.name != "平" && sj.arr.length > 0) {
            shengjiangWrapper.append(`<span>${sj.name}：${sj.arr.map(x => "<span class=\"yw\" onclick=highlightYaoWithSameName(this)>" + x + "</span>").join("、")}`);
            shengjiangWrapper.append("<br/>");
        }
    });

    guijingList.forEach(gj => {
        guijingWrapper.append(`<span>${gj.name}：${gj.arr.map(x => "<span class=\"yw\" onclick=highlightYaoWithSameName(this)>" + x + "</span>").join("、")}`);
        guijingWrapper.append("<br/>");
    });
}

function triggerFangSearch(fang) {
    $("#search_input").val(fang);
    analyze();
}

function triggerSearch(ele) {
    $("#search_input").val($(ele).text());
    analyze();
}

function highlightYaodui(ele) {
    let yaodui = $(ele).html();
    let yaoList = yaodui.split("--")[0].split("+");
    let isHighlighted = $(ele).hasClass("highlighted");

    $("#yaodui_wrapper .yd").each(function () {
        if ($(this).html() == yaodui) {
            $(this).toggleClass("highlighted");
        }
        else {
            $(this).removeClass("highlighted");
        }
    });

    $("#yao_details .yw").each(function () {
        if (yaoList.indexOf($(this).html()) >= 0) {
            if (isHighlighted) {
                $(this).removeClass("highlighted");
            }
            else {
                $(this).addClass("highlighted");
            }
        }
        else {
            $(this).removeClass("highlighted");
        }
    });
}

function highlightYaoWithSameName(ele) {
    let yao = $(ele).html();

    $("#yao_details .yw").each(function () {
        if ($(this).html() == yao) {
            $(this).toggleClass("highlighted");
        }
        else {
            $(this).removeClass("highlighted");
        }
    });

    $("#yaodui_wrapper .yd").each(function () {
        $(this).removeClass("highlighted");
    });
}

function getHighlightedYaoArr() {
    let yaoArr = [];

    $("#yao_details .yw").each(function () {
        if ($(this).hasClass("highlighted") && yaoArr.indexOf($(this).html()) < 0) {
            yaoArr.push($(this).html());
        }
    });

    return yaoArr;
}

function highlightYaoByYaoArr(yaoArr) {
    if (!yaoArr || yaoArr.length == 0) {
        return;
    }

    $("#yao_details .yw").each(function () {
        if (yaoArr.indexOf($(this).html()) >= 0) {
            $(this).addClass("highlighted");
        }
        else {
            $(this).removeClass("highlighted");
        }
    });

    $("#yaodui_wrapper .yd").each(function () {
        let yaodui = $(this).html();
        let yaoList = yaodui.split("--")[0].split("+");
        if (yaoList.every(x => yaoArr.indexOf(x) >= 0)) {
            $(this).addClass("highlighted");
        }
        else {
            $(this).removeClass("highlighted");
        }
    });
}

function loadMoreOrLessFang(ele) {
    let icon = $(ele).children("img");

    $(".fang-inner-wrapper").each(function () {
        let sequence = +$(this).data("sequence");
        if (sequence >= defaultDisplayedFang) {
            if (icon.hasClass("flip")) {
                $(this).addClass("hidden");
            }
            else {
                $(this).removeClass("hidden");
            }
        }
    });

    icon.toggleClass("flip");
}

function getYaoInputArr() {
    return $("#search_input").val().replace(nonHanziRegex, ",").split(",");
}

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function precisionRound(number, precision) {
    let factor = Math.pow(10, precision);
    return Math.round(number * factor) / factor;
}

function createCookie(name, value, days) {
    let expires = "";
    if (days) {
        let date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }

    document.cookie = name + "=" + value + expires + "; path=/";
}

function readCookie(name) {
    let nameEQ = name + "=";
    let ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function eraseCookie(name) {
    createCookie(name, "", -1);
}