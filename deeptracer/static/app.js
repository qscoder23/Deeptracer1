const themes = ["mist", "paper", "night"];
const loadingCopies = [
    "像素猫正在巡检结构、性能和内存，请稍等一下。",
    "正在梳理函数之间的关系，马上给你结果。",
    "热点和内存摘要还在整理中，很快就好。",
    "正在生成更容易理解的修改建议。"
];

const sampleCode = `BOOKS = [
    {"title": "Python 起步", "topic": "python", "pages": 180, "level": "beginner", "borrowed": 8},
    {"title": "数据结构轻读", "topic": "algorithm", "pages": 240, "level": "intermediate", "borrowed": 5},
    {"title": "可视化故事", "topic": "data", "pages": 210, "level": "beginner", "borrowed": 7},
    {"title": "函数式思维", "topic": "python", "pages": 320, "level": "advanced", "borrowed": 3},
    {"title": "图解排序", "topic": "algorithm", "pages": 190, "level": "beginner", "borrowed": 6},
    {"title": "数据分析练习", "topic": "data", "pages": 280, "level": "intermediate", "borrowed": 4}
]


def score_book(book):
    score = book["borrowed"] * 2
    if book["level"] == "beginner":
        score += 3
    if book["pages"] < 220:
        score += 2
    return score


def find_titles_for_topic(books, topic):
    titles = []
    for book in books:
        if book["topic"] == topic:
            titles.append(book["title"])
    return titles


def build_topic_summary(books):
    summary = {}
    for book in books:
        topic = book["topic"]
        if topic not in summary:
            summary[topic] = {
                "count": 0,
                "pages": 0,
                "score": 0,
                "titles": find_titles_for_topic(books, topic)
            }
        summary[topic]["count"] += 1
        summary[topic]["pages"] += book["pages"]
        summary[topic]["score"] += score_book(book)
    return summary


def choose_focus_topic(summary):
    best_topic = ""
    best_score = -1
    for topic, info in summary.items():
        if info["score"] > best_score:
            best_topic = topic
            best_score = info["score"]
    return best_topic, summary[best_topic]


def explain_focus(topic, info):
    avg_pages = info["pages"] // info["count"]
    return {
        "topic": topic,
        "count": info["count"],
        "avg_pages": avg_pages,
        "titles": info["titles"]
    }


def main():
    summary = build_topic_summary(BOOKS)
    focus_topic, focus_info = choose_focus_topic(summary)
    result = explain_focus(focus_topic, focus_info)
    print("summary:", summary)
    print("focus:", result)


if __name__ == "__main__":
    main()
`;

const demoData = {
    heroMetrics: [
        { label: "分析对象", value: "示例代码", note: "可以直接替换成你自己的代码" },
        { label: "代码行数", value: "64", note: "输入框里的内容会参与分析" },
        { label: "重点函数", value: "build_topic_summary", note: "按结构复杂度排序" },
        { label: "分析环境", value: "Python 3.11", note: "执行可视化会自动切到兼容模式" }
    ],
    analysisMap: {
        workflow: {
            title: "概览",
            summary: "先看整体，再决定要不要继续往下看。",
            cards: [
                { label: "结构复杂度", value: "61", note: "分支和函数拆分处于中等复杂度" },
                { label: "热点集中度", value: "73", note: "耗时主要集中在少数关键函数" },
                { label: "内存压力", value: "24", note: "当前内存压力不高" },
                { label: "修改空间", value: "68", note: "有几处很适合先做的小重构" }
            ],
            bars: [],
            points: [
                "这段代码的主任务很清楚，但数据清洗和打分逻辑可以再拆开一点。",
                "真正需要优先看的往往是最慢的函数，而不是代码里最长的函数。",
                "如果你只想先改一处，优先从热点函数和高复杂度函数交叉的地方开始。"
            ]
        },
        ast: {
            title: "结构",
            summary: "帮助你快速看懂代码是不是过长、过绕，或者职责不清。",
            cards: [
                { label: "函数数量", value: "5" },
                { label: "重点函数", value: "build_topic_summary" },
                { label: "输出语句", value: "2" }
            ],
            bars: [
                { label: "build_topic_summary", value: 74 },
                { label: "find_titles_for_topic", value: 58 },
                { label: "choose_focus_topic", value: 33 }
            ],
            points: [
                "如果一个函数承担了太多事情，先拆小通常最容易读懂。",
                "结构清楚以后，性能和内存结果也会更容易理解。",
                "刚开始学 Python 时，先看每个函数是不是只做一件事。"
            ]
        },
        performance: {
            title: "性能",
            summary: "不是为了炫技，只是帮你先找到哪里最慢。",
            cards: [
                { label: "分析环境", value: "Python 3.11" },
                { label: "热点函数", value: "find_titles_for_topic" },
                { label: "热点数量", value: "2" }
            ],
            bars: [
                { label: "find_titles_for_topic", value: 63 },
                { label: "build_topic_summary", value: 24 },
                { label: "choose_focus_topic", value: 13 }
            ],
            points: [
                "如果一段代码很慢，先看热点，再决定是否优化。",
                "不是所有代码都需要优化，先保证能看懂更重要。",
                "热点条越长，通常越值得优先关注。"
            ]
        },
        memory: {
            title: "内存",
            summary: "这里帮助你判断是不是有太多数据被留在内存里。",
            cards: [
                { label: "峰值内存", value: "0.58 MB" },
                { label: "热点位置", value: "2" },
                { label: "运行状态", value: "正常" }
            ],
            bars: [
                { label: "第 30 行", value: 43 },
                { label: "第 18 行", value: 26 }
            ],
            points: [
                "如果某个大对象存在太久，内存就会升高。",
                "这里的结果适合用来发现明显的大列表或大字典。",
                "就算不懂底层原理，也能先从“是不是存太多”开始理解。"
            ]
        }
    },
    suggestions: [
        {
            id: "split-parser",
            title: "把 build_topic_summary 里的重复扫描收一收",
            priority: "优先看看",
            confidence: "高",
            impact: "更容易理解",
            risk: "低",
            file: "当前代码",
            note: "现在每遇到一个 topic，都会再扫一遍整份书单来找标题。",
            explanation: "这段示例很适合展示结构分析和执行可视化，但如果继续扩展数据量，重复扫描会让主流程变慢。先把标题收集和统计放到同一轮循环里，会更清楚也更省步骤。",
            diff: [
                [1, " ", "def build_topic_summary(books):", "context"],
                [2, "-", "            \"titles\": find_titles_for_topic(books, topic)", "remove"],
                [2, "+", "            \"titles\": []", "add"],
                [3, "+", "        summary[topic][\"titles\"].append(book[\"title\"])", "add"]
            ]
        }
    ],
    meta: {
        llmConfigured: false,
        provider: "openai",
        model: "default"
    }
};

let dataStore = deepClone(demoData);
let loadingTimer = null;
let currentTutorVisualizer = null;
let tutorConnectorRedrawQueued = false;
let tutorConnectorTracking = false;

const state = {
    theme: "mist",
    activeTab: "workflow",
    activeSuggestion: demoData.suggestions[0].id,
    loading: false,
    loadingStep: 0
};

const el = {
    sourceCode: document.getElementById("sourceCode"),
    lineNumbers: document.getElementById("lineNumbers"),
    lineCountBadge: document.getElementById("lineCountBadge"),
    statusText: document.getElementById("statusText"),
    summaryCards: document.getElementById("summaryCards"),
    tabSummary: document.getElementById("tabSummary"),
    tabBars: document.getElementById("tabBars"),
    tabPoints: document.getElementById("tabPoints"),
    suggestionList: document.getElementById("suggestionList"),
    suggestionDetail: document.getElementById("suggestionDetail"),
    diffFile: document.getElementById("diffFile"),
    diffNote: document.getElementById("diffNote"),
    diffLines: document.getElementById("diffLines"),
    loadingOverlay: document.getElementById("loadingOverlay"),
    loadingText: document.getElementById("loadingText"),
    runAnalysis: document.getElementById("runAnalysis"),
    tutorStatus: document.getElementById("tutorStatus"),
    syncTutor: document.getElementById("syncTutor"),
    tutorVisualizerMount: document.getElementById("tutorVisualizerMount"),
    tutorPlaceholder: document.getElementById("tutorPlaceholder")
};

function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
}

function currentSuggestions() {
    return dataStore.suggestions || [];
}

function currentAnalysis() {
    return dataStore.analysisMap || {};
}

function currentSuggestion() {
    const suggestions = currentSuggestions();
    return suggestions.find((item) => item.id === state.activeSuggestion) || suggestions[0];
}

function setStatus(text) {
    el.statusText.textContent = text;
}

function setTheme(theme) {
    state.theme = theme;
    document.body.dataset.theme = theme;
}

function updateLineNumbers() {
    const lineCount = Math.max(1, el.sourceCode.value.split("\n").length);
    const lines = [];
    for (let index = 1; index <= lineCount; index += 1) {
        lines.push(String(index));
    }
    el.lineNumbers.value = lines.join("\n");
    el.lineCountBadge.textContent = `${lineCount} 行`;
}

function syncLineNumberScroll() {
    el.lineNumbers.scrollTop = el.sourceCode.scrollTop;
}

function resetTutorSurface() {
    currentTutorVisualizer = null;
    tutorConnectorRedrawQueued = false;
    tutorConnectorTracking = false;
    delete el.tutorVisualizerMount.dataset.connectorBindingsReady;
    el.tutorVisualizerMount.hidden = true;
    el.tutorVisualizerMount.innerHTML = "";
    el.tutorPlaceholder.hidden = false;
}

function queueTutorConnectorRedraw() {
    if (!currentTutorVisualizer || typeof currentTutorVisualizer.redrawConnectors !== "function") {
        return;
    }
    if (tutorConnectorRedrawQueued) {
        return;
    }

    tutorConnectorRedrawQueued = true;
    window.requestAnimationFrame(() => {
        tutorConnectorRedrawQueued = false;
        if (!currentTutorVisualizer || typeof currentTutorVisualizer.redrawConnectors !== "function") {
            return;
        }
        currentTutorVisualizer.redrawConnectors();
    });
}

function redrawTutorConnectorsImmediate() {
    if (!currentTutorVisualizer || typeof currentTutorVisualizer.redrawConnectors !== "function") {
        return;
    }

    tutorConnectorRedrawQueued = false;
    currentTutorVisualizer.redrawConnectors();
}

function startTutorConnectorTracking() {
    if (tutorConnectorTracking) {
        return;
    }
    tutorConnectorTracking = true;
    redrawTutorConnectorsImmediate();

    const tick = () => {
        if (!tutorConnectorTracking) {
            return;
        }
        redrawTutorConnectorsImmediate();
        window.requestAnimationFrame(tick);
    };

    window.requestAnimationFrame(tick);
}

function stopTutorConnectorTracking() {
    tutorConnectorTracking = false;
    redrawTutorConnectorsImmediate();
}

function renderSummaryCards() {
    el.summaryCards.innerHTML = (dataStore.heroMetrics || []).map((item) => `
        <article class="summary-card">
            <span>${item.label}</span>
            <strong>${item.value}</strong>
            <div class="suggestion-meta">${item.note || ""}</div>
        </article>
    `).join("");
}

function renderWorkflowMetrics(tabData) {
    const cards = tabData.cards || [];
    if (!cards.length) {
        return `
            <div class="notes-item">
                当前没有可展示的概览指标。
            </div>
        `;
    }

    return `
        <div class="metric-grid">
            ${cards.map((item) => `
                <article class="metric-card">
                    <span>${item.label}</span>
                    <strong>${item.value}</strong>
                    <p>${item.note || ""}</p>
                </article>
            `).join("")}
        </div>
    `;
}

function renderTab() {
    const tabData = currentAnalysis()[state.activeTab] || currentAnalysis().workflow || {};
    const bars = tabData.bars || [];

    el.tabSummary.innerHTML = `
        <p class="eyebrow">${tabData.title || ""}</p>
        <p>${tabData.summary || ""}</p>
    `;

    if (state.activeTab === "workflow") {
        el.tabBars.innerHTML = renderWorkflowMetrics(tabData);
    } else {
        el.tabBars.innerHTML = `
            <div class="chart-list">
                ${bars.map((item) => `
                    <div class="chart-item">
                        <div class="chart-meta">
                            <span>${item.label}</span>
                            <strong>${item.value}%</strong>
                        </div>
                        <div class="chart-track">
                            <div class="chart-fill" style="width:${Math.max(0, Math.min(100, item.value || 0))}%"></div>
                        </div>
                    </div>
                `).join("")}
            </div>
        `;
    }

    el.tabPoints.innerHTML = `
        <div class="notes-list">
            ${(tabData.points || []).map((text) => `<div class="notes-item">${text}</div>`).join("")}
        </div>
    `;

    document.querySelectorAll("#resultTabs button").forEach((button) => {
        button.classList.toggle("is-active", button.dataset.tab === state.activeTab);
    });
}

function renderSuggestions() {
    el.suggestionList.innerHTML = currentSuggestions().map((item) => `
        <button class="suggestion-item ${item.id === state.activeSuggestion ? "is-active" : ""}" type="button" data-suggestion="${item.id}">
            <div class="suggestion-title">${item.title}</div>
            <div class="suggestion-meta">${item.note || ""}</div>
        </button>
    `).join("");
}

function renderSuggestionDetail() {
    const item = currentSuggestion();
    if (!item) {
        el.suggestionDetail.innerHTML = "<p>还没有可展示的建议。</p>";
        el.diffFile.textContent = "当前代码";
        el.diffNote.textContent = "分析完成后，这里会显示建议的差异预览。";
        el.diffLines.innerHTML = "";
        return;
    }

    el.suggestionDetail.innerHTML = `
        <p class="eyebrow">为什么建议这样改</p>
        <h3>${item.title}</h3>
        <p>${item.explanation || ""}</p>
        <div class="suggestion-meta">建议强度：${item.priority || "-"} · 置信度：${item.confidence || "-"} · 风险：${item.risk || "-"}</div>
    `;

    el.diffFile.textContent = item.file || "当前代码";
    el.diffNote.textContent = item.note || "";
    el.diffLines.innerHTML = (item.diff || []).map(([line, marker, text, type]) => `
        <div class="diff-line ${type}">
            <span class="line-number">${line}</span>
            <span>${marker}</span>
            <span>${text}</span>
        </div>
    `).join("");
}

function renderAll() {
    renderSummaryCards();
    renderTab();
    renderSuggestions();
    renderSuggestionDetail();
}

function applyPayload(payload) {
    dataStore = {
        heroMetrics: payload.heroMetrics || deepClone(demoData.heroMetrics),
        analysisMap: payload.analysisMap || deepClone(demoData.analysisMap),
        suggestions: payload.suggestions && payload.suggestions.length ? payload.suggestions : deepClone(demoData.suggestions),
        meta: payload.meta || {}
    };

    state.activeTab = "workflow";
    state.activeSuggestion = (currentSuggestions()[0] && currentSuggestions()[0].id) || demoData.suggestions[0].id;
    renderAll();
}

function buildAnalysisStatus(meta = {}) {
    const mode = meta.llmConfigured
        ? `多智能体已启用：${meta.provider || "openai"} / ${meta.model || "default"}`
        : "当前使用本地回退模式，配置模型 API 后会自动启用多智能体结果";

    if (meta.runtimeError) {
        return `分析已完成，但代码执行时出现异常：${meta.runtimeError}。${mode}`;
    }

    return `分析完成。${mode}`;
}

function setLoading(loading) {
    state.loading = loading;
    document.body.classList.toggle("is-loading", loading);
    el.loadingOverlay.hidden = !loading;
    el.runAnalysis.disabled = loading;

    if (!loading) {
        if (loadingTimer) {
            window.clearInterval(loadingTimer);
            loadingTimer = null;
        }
        return;
    }

    state.loadingStep = 0;
    el.loadingText.textContent = loadingCopies[state.loadingStep];
    loadingTimer = window.setInterval(() => {
        state.loadingStep = (state.loadingStep + 1) % loadingCopies.length;
        el.loadingText.textContent = loadingCopies[state.loadingStep];
    }, 1200);
}

function sanitizeTutorCode(code) {
    const unsupportedImports = ["numpy", "pandas", "matplotlib", "networkx", "sklearn", "torch", "tensorflow"];
    const lines = code.split("\n");
    const sanitized = [];
    let removedSomething = false;

    lines.forEach((line) => {
        const trimmed = line.trim();
        if (trimmed.startsWith("import ")) {
            const modules = trimmed.replace("import ", "").split(",").map((item) => item.trim());
            const supported = modules.filter((item) => !unsupportedImports.includes(item));
            if (!supported.length) {
                removedSomething = true;
                return;
            }
            if (supported.length !== modules.length) {
                removedSomething = true;
            }
            sanitized.push(`import ${supported.join(", ")}`);
            return;
        }

        if (trimmed.startsWith("from ")) {
            const moduleName = trimmed.split(/\s+/)[1];
            if (unsupportedImports.includes(moduleName)) {
                removedSomething = true;
                return;
            }
        }

        sanitized.push(line);
    });

    return {
        code: sanitized.join("\n"),
        changed: removedSomething
    };
}

function getTutorInputFromEditor() {
    const code = el.sourceCode.value.trim();
    if (!code) {
        return null;
    }

    const tutorInput = sanitizeTutorCode(code);
    el.tutorStatus.textContent = tutorInput.changed
        ? "已自动简化 Python Tutor 不支持的第三方依赖，保留的是可执行演示版本。"
        : "当前代码会直接在页内执行可视化面板中展示。";
    return tutorInput;
}

function styleTutorVisualizer() {
    const root = el.tutorVisualizerMount;
    if (!root) {
        return;
    }

    root.querySelectorAll("#editCodeLinkDiv").forEach((node) => {
        node.remove();
    });
    root.querySelectorAll("#codeFooterDocs").forEach((node) => {
        node.remove();
    });

    if (root.dataset.connectorBindingsReady === "true") {
        return;
    }
    root.dataset.connectorBindingsReady = "true";

    root.querySelectorAll("#pyCodeOutputDiv, #dataViz, #codAndNav").forEach((node) => {
        node.addEventListener("scroll", redrawTutorConnectorsImmediate, { passive: true });
        node.addEventListener("pointerdown", startTutorConnectorTracking, { passive: true });
        node.addEventListener("pointermove", redrawTutorConnectorsImmediate, { passive: true });
        node.addEventListener("pointerup", stopTutorConnectorTracking, { passive: true });
        node.addEventListener("pointercancel", stopTutorConnectorTracking, { passive: true });
        node.addEventListener("wheel", redrawTutorConnectorsImmediate, { passive: true });
    });

    window.addEventListener("pointerup", stopTutorConnectorTracking, { passive: true });
    window.addEventListener("pointercancel", stopTutorConnectorTracking, { passive: true });
}

async function syncTutorView() {
    const tutorInput = getTutorInputFromEditor();
    if (!tutorInput) {
        el.tutorStatus.textContent = "请先输入代码，再同步执行可视化。";
        resetTutorSurface();
        return;
    }

    try {
        if (typeof window.addVisualizerToPage !== "function") {
            throw new Error("Python Tutor 前端资源还没准备好，请稍后再试");
        }

        const response = await fetch("/api/tutor/trace", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                code: tutorInput.code,
                options: {
                    cumulative_mode: false,
                    heap_primitives: false
                }
            })
        });
        const payload = await response.json();

        if (!response.ok) {
            throw new Error(payload.detail || "执行可视化生成失败");
        }

        el.tutorPlaceholder.hidden = true;
        el.tutorVisualizerMount.hidden = false;
        el.tutorVisualizerMount.innerHTML = "";

        currentTutorVisualizer = window.addVisualizerToPage(payload, "tutorVisualizerMount", {
            embeddedMode: false,
            verticalStack: false,
            startingInstruction: 0,
            codeDivWidth: 520,
            codeDivHeight: 560
        });

        styleTutorVisualizer();
        queueTutorConnectorRedraw();
        el.tutorStatus.textContent = "执行可视化已同步。左侧显示源代码，右侧可以按步骤查看变量、调用栈和对象状态。";
    } catch (error) {
        console.error(error);
        resetTutorSurface();
        el.tutorStatus.textContent = `执行可视化加载失败：${error.message}`;
    }
}

async function runAnalysis() {
    const code = el.sourceCode.value.trim();
    if (!code) {
        setStatus("请先输入 Python 代码。");
        return;
    }

    setLoading(true);
    setStatus("正在分析这段代码，请稍等...");

    try {
        const response = await fetch("/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code })
        });
        const payload = await response.json();

        if (!response.ok) {
            throw new Error(payload.detail || "分析失败");
        }

        applyPayload(payload);
        setStatus(buildAnalysisStatus(payload.meta || {}));
        try {
            await syncTutorView();
        } catch (tutorError) {
            console.error(tutorError);
        }
    } catch (error) {
        console.error(error);
        setStatus(`分析失败：${error.message}`);
    } finally {
        setLoading(false);
    }
}

function loadSample() {
    el.sourceCode.value = sampleCode;
    dataStore = deepClone(demoData);
    state.activeTab = "workflow";
    state.activeSuggestion = demoData.suggestions[0].id;
    updateLineNumbers();
    syncLineNumberScroll();
    renderAll();
    setStatus("示例已载入。这段代码同时适合结构分析、多智能体建议和执行可视化演示。");
    void syncTutorView();
}

function clearCode() {
    el.sourceCode.value = "";
    dataStore = deepClone(demoData);
    state.activeTab = "workflow";
    state.activeSuggestion = demoData.suggestions[0].id;
    updateLineNumbers();
    syncLineNumberScroll();
    renderAll();
    setStatus("输入框已清空。");
    el.tutorStatus.textContent = "分析环境是 Python 3.11。点击“分析代码”后，当前代码会直接显示在页内可视化区域。";
    resetTutorSurface();
}

function bind() {
    document.getElementById("themeToggle").addEventListener("click", () => {
        const index = themes.indexOf(state.theme);
        setTheme(themes[(index + 1) % themes.length]);
    });

    document.getElementById("loadSample").addEventListener("click", loadSample);
    document.getElementById("clearCode").addEventListener("click", clearCode);
    document.getElementById("runAnalysis").addEventListener("click", runAnalysis);
    el.syncTutor.addEventListener("click", syncTutorView);

    el.sourceCode.addEventListener("input", () => {
        updateLineNumbers();
        el.tutorStatus.textContent = "代码已更新。点“分析代码”或“刷新可视化”后，会在当前页内重新生成执行步骤。";
    });

    el.sourceCode.addEventListener("scroll", syncLineNumberScroll);

    document.getElementById("resultTabs").addEventListener("click", (event) => {
        const button = event.target.closest("button[data-tab]");
        if (!button) {
            return;
        }
        state.activeTab = button.dataset.tab;
        renderTab();
    });

    el.suggestionList.addEventListener("click", (event) => {
        const button = event.target.closest("[data-suggestion]");
        if (!button) {
            return;
        }
        state.activeSuggestion = button.dataset.suggestion;
        renderSuggestions();
        renderSuggestionDetail();
    });
}

setTheme(state.theme);
loadSample();
bind();
