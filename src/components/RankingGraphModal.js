import React, { useEffect, useRef, useState } from 'react';
import * as Plot from "@observablehq/plot";


// Standard ranks supported by the data source
const SUPPORTED_RANKS = [
    1, 2, 3, 10, 20, 30, 40, 50,
    100, 200, 300, 400, 500,
    1000, 1500, 2000, 2500, 3000,
    4000, 5000, 10000
];

const RankingGraphModal = ({ isOpen, onClose, rank, t }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const modalRef = useRef(null);
    const contentRef = useRef(null);

    // Zoom State
    const [xDomain, setXDomain] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState(null);

    // Reset domain when rank changes or closes
    useEffect(() => {
        if (!isOpen) {
            setXDomain(null);
        }
    }, [isOpen, rank]);

    // Initialize domain when data loads
    useEffect(() => {
        if (window.sekarunDataLoaded && window.data && isOpen && !xDomain) {
            const { currentEvent } = window;
            const ranksToShow = getAdjacentRanks(rank);
            // Filter data to find full range
            const filteredData = window.data.filter(x => x.eid === currentEvent && ranksToShow.includes(x.b));
            if (filteredData.length > 0) {
                const minTfe = Math.min(...filteredData.map(d => d.tfe));
                setXDomain([minTfe, 0]); // Always end at 0 (End of event)
            }
        }
    }, [isOpen, rank, window.sekarunDataLoaded, xDomain]); // Added xDomain to dependency to avoid loop? No, if !xDomain check prevents loop.

    // Touch State
    const [touchStart, setTouchStart] = useState(null); // { dist, domain, x }

    // Interaction Handlers
    // Interaction Handlers need access to these
    // Use refs or component-scoped constants defined later, 
    // OR define them here ONCE and remove later definitions.

    // Let's define them here at the top of the component scope so they are available everywhere.
    // And remove the re-declarations down below.
    const PLOT_WIDTH_DESKTOP = 1000;
    const MARGIN_LEFT = 60;
    const MARGIN_RIGHT = 40;

    // Dynamic width tracking
    const plotWidthRef = useRef(PLOT_WIDTH_DESKTOP);
    const isMobile = window.innerWidth < 768;

    const handleWheel = (e) => {
        if (!xDomain) return;
        e.preventDefault();

        const rect = contentRef.current.getBoundingClientRect();
        const currentPlotWidth = plotWidthRef.current;
        const currentInnerWidth = currentPlotWidth - MARGIN_LEFT - MARGIN_RIGHT;

        const relX = e.clientX - rect.left;
        const scaleRatio = currentPlotWidth / rect.width;
        const svgX = relX * scaleRatio;

        const [dMin, dMax] = xDomain;
        const domainSpan = dMax - dMin;

        const clampedSvgX = Math.max(MARGIN_LEFT, Math.min(currentPlotWidth - MARGIN_RIGHT, svgX));
        const cursorVal = dMin + (clampedSvgX - MARGIN_LEFT) / currentInnerWidth * domainSpan;

        const zoomFactor = e.deltaY < 0 ? 0.9 : 1.1;
        const newSpan = domainSpan * zoomFactor;

        if (newSpan < 1) return;

        const ratio = (clampedSvgX - MARGIN_LEFT) / currentInnerWidth;
        let newMin = cursorVal - ratio * newSpan;
        let newMax = newMin + newSpan;

        setXDomain([newMin, newMax]);
    };

    const handleMouseDown = (e) => {
        if (!xDomain) return;
        setIsDragging(true);
        setDragStart({ x: e.clientX, domain: [...xDomain] });
    };

    const handleMouseMove = (e) => {
        if (!isDragging || !dragStart || !xDomain) return;
        e.preventDefault();

        const dxPx = e.clientX - dragStart.x;
        const rect = contentRef.current.getBoundingClientRect();
        const currentPlotWidth = plotWidthRef.current;
        const currentInnerWidth = currentPlotWidth - MARGIN_LEFT - MARGIN_RIGHT;

        const scaleRatio = currentPlotWidth / rect.width;
        const dxSvg = dxPx * scaleRatio;

        const [startMin, startMax] = dragStart.domain;
        const span = startMax - startMin;

        const dxDomain = - (dxSvg / currentInnerWidth) * span;

        setXDomain([startMin + dxDomain, startMax + dxDomain]);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        setDragStart(null);
    };

    const getTouchDist = (touches) => {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    };

    const getTouchCenter = (touches, rect) => {
        const cx = (touches[0].clientX + touches[1].clientX) / 2;
        return cx - rect.left;
    };

    const handleTouchStart = (e) => {
        if (!xDomain) return;
        if (e.cancelable) e.preventDefault();

        const rect = contentRef.current.getBoundingClientRect();

        if (e.touches.length === 1) {
            setTouchStart({
                mode: 'pan',
                x: e.touches[0].clientX,
                domain: [...xDomain]
            });
        } else if (e.touches.length === 2) {
            const dist = getTouchDist(e.touches);
            const center = getTouchCenter(e.touches, rect);
            setTouchStart({
                mode: 'zoom',
                dist: dist,
                center: center,
                domain: [...xDomain]
            });
        }
    };

    const handleTouchMove = (e) => {
        if (!touchStart || !xDomain) return;
        if (e.cancelable) e.preventDefault();

        const rect = contentRef.current.getBoundingClientRect();
        const currentPlotWidth = plotWidthRef.current;
        const currentInnerWidth = currentPlotWidth - MARGIN_LEFT - MARGIN_RIGHT;
        const scaleRatio = currentPlotWidth / rect.width;

        if (e.touches.length === 1 && touchStart.mode === 'pan') {
            const dxPx = e.touches[0].clientX - touchStart.x;
            const dxSvg = dxPx * scaleRatio;

            const [startMin, startMax] = touchStart.domain;
            const span = startMax - startMin;

            const dxDomain = - (dxSvg / currentInnerWidth) * span;

            setXDomain([startMin + dxDomain, startMax + dxDomain]);

        } else if (e.touches.length === 2 && touchStart.mode === 'zoom') {
            const newDist = getTouchDist(e.touches);
            const zoomFactor = touchStart.dist / newDist;

            const [dMin, dMax] = touchStart.domain;
            const domainSpan = dMax - dMin;
            const newSpan = domainSpan * zoomFactor;
            if (newSpan < 1) return;

            const svgX = touchStart.center * scaleRatio;
            const clampedSvgX = Math.max(MARGIN_LEFT, Math.min(currentPlotWidth - MARGIN_RIGHT, svgX));

            const ratio = (clampedSvgX - MARGIN_LEFT) / currentInnerWidth;
            const centerVal = dMin + ratio * domainSpan;

            const newMin = centerVal - ratio * newSpan;
            const newMax = newMin + newSpan;

            setXDomain([newMin, newMax]);
        }
    };

    const handleTouchEnd = () => {
        setTouchStart(null);
    };

    // Load data and logic
    useEffect(() => {
        if (!isOpen) return;

        setLoading(true);
        setError(null);

        // Fetch from custom API
        fetch("https://api.rilaksekai.com/api/ranking")
            .then(res => {
                if (!res.ok) throw new Error("Failed to fetch ranking data");
                return res.json();
            })
            .then(apiData => {
                try {
                    const { event_info, ranks } = apiData;

                    if (!event_info || !ranks) {
                        throw new Error("Invalid data format");
                    }

                    window.now = new Date();
                    window.currentEvent = event_info.id;
                    window.currentEventEnd = new Date(event_info.end * 1000);
                    window.timeToCurrentEventEnd = Math.min(0, (window.now - window.currentEventEnd) / 36e5);

                    // Transform structure
                    const flatData = [];

                    ranks.forEach(rankObj => {
                        const r = rankObj.rank;
                        rankObj.points.forEach(p => {
                            flatData.push({
                                eid: event_info.id,
                                t: p.type, // 'r' or 'p'
                                tfe: (p.ts - event_info.end) / 3600, // Calculated Time From End
                                ep: p.ep,
                                b: r,
                                ts: new Date(p.ts * 1000),
                                s: 0, // Source unknown/default
                                l: p.l || 0, // Lower bound
                                u: p.u || 0, // Upper bound
                                n: null
                            });
                        });
                    });

                    window.data = flatData;
                    window.sekarunDataLoaded = true;
                    setLoading(false);

                    // Initialize xDomain 
                    const allTfe = flatData.map(d => d.tfe);
                    const minTfe = Math.min(...allTfe);

                    // Show full range by default
                    setXDomain([minTfe, 0]);

                } catch (err) {
                    console.error("Error processing API data:", err);
                    setError("Error processing data");
                    setLoading(false);
                }
            })
            .catch(err => {
                console.error("Fetch error:", err);
                setError("Failed to load data");
                setLoading(false);
            });

        return () => {
            // Cleanup if needed
        };
    }, [isOpen]);



    // Format Y Axis Tick
    const formatTick = (d) => {
        if (d >= 10000) {
            const manStr = (d / 10000).toLocaleString();
            return `${manStr}만`;
        }
        return d.toLocaleString();
    };

    // Render Graphs
    useEffect(() => {
        if (!isOpen || loading || error || !contentRef.current || !window.sekarunDataLoaded) return;

        // Responsive Sizing
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        // const isMobile = screenWidth < 768; // Already defined in component scope

        let plotWidth = PLOT_WIDTH_DESKTOP;
        let plotHeight = 600;
        let axisFontSize = '10px';

        if (isMobile) {
            // Mobile: Width = Screen (minus margins), Height = Taller than width (Portrait)
            // Use native pixels, no scaling.
            plotWidth = screenWidth - 24; // Small margin (px-2? say 12px each side approx)

            // Current user request: "Vertical longer than horizontal on mobile"
            // Let's set height to be significantly taller, e.g. 1.5x width or 70vh
            plotHeight = Math.max(plotWidth * 1.0, screenHeight * 0.7);

            // Standard font size is fine since we aren't scaling down
            axisFontSize = '11px';
        }

        // Update ref for handlers
        plotWidthRef.current = plotWidth;

        const PLOT_INNER_WIDTH = plotWidth - MARGIN_LEFT - MARGIN_RIGHT;


        // Clear previous content
        contentRef.current.innerHTML = '';

        const ranksToShow = getAdjacentRanks(rank);

        // Create container for the graph
        const container = document.createElement('div');
        container.className = "mb-8 relative select-none graph-container";

        // Add Custom Styles for Tooltip and Axis Fonts
        const style = document.createElement('style');
        style.innerHTML = `
            figure {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                margin: 0 !important; /* Reset browser default margin */
                max-width: 100%;
            }
            svg {
                max-width: 100%;
                height: auto;
                display: block; /* Remove bottom alignment gap */
                overflow: visible !important;
            }
            /* Adjust axis fonts */
            g[aria-label="x-axis tick"] text, g[aria-label="y-axis tick"] text {
                font-size: ${axisFontSize} !important;
            }
            .plot-tooltip {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
                background: white !important;
                border: 1px solid #e5e7eb !important;
                border-radius: 12px !important;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
                padding: 12px !important;
                color: #374151 !important;
                opacity: 1 !important;
                z-index: 1000;
                pointer-events: none;
                white-space: pre-wrap !important;
            }
            /* Disable touch actions on the graph container to prevent system zoom */
            .graph-container {
                touch-action: none;
            }
            .plot-tooltip div > div:first-child {
                font-weight: 700 !important;
                color: #6b7280 !important;
                margin-right: 8px !important;
            }
            .plot-tooltip div > div:last-child {
                font-weight: 600 !important;
                color: #111827 !important;
            }
        `;
        container.appendChild(style);
        contentRef.current.appendChild(container);

        // Render Scale
        try {
            const plot = renderPlot(ranksToShow, xDomain, plotWidth, plotHeight);
            if (plot) {
                container.appendChild(plot);
            } else {
                container.innerText += " (No Data)";
            }
        } catch (e) {
            console.error(e);
            container.innerText += " (Error rendering graph)";
        }

    }, [isOpen, loading, error, rank, t, xDomain]);

    // Helper to get adjacent ranks
    const getAdjacentRanks = (targetRank) => {
        const numericRank = parseInt(targetRank);
        if (!SUPPORTED_RANKS.includes(numericRank)) return [numericRank];

        const idx = SUPPORTED_RANKS.indexOf(numericRank);
        const result = [];

        if (idx > 0) result.push(SUPPORTED_RANKS[idx - 1]);
        result.push(numericRank);
        if (idx < SUPPORTED_RANKS.length - 1) result.push(SUPPORTED_RANKS[idx + 1]);

        return result;
    };

    // Plotting Logic
    const renderPlot = (b, domainX, width, height) => {
        const { data, currentEvent, timeToCurrentEventEnd } = window;

        let filteredData = data.filter(x => x.eid === currentEvent && b.includes(x.b));
        if (filteredData.length === 0) return null;

        const maxEp = Math.max(...filteredData.map(d => Math.max(d.ep, d.u || 0)));
        const yDomainMax = maxEp > 0 ? maxEp * 1.05 : undefined;

        // Custom Tick Format for Y Axis (Decimal 'man')
        const formatDecimalMan = (d) => {
            if (d >= 10000) {
                return `${(d / 10000).toFixed(1)}만`;
            }
            return d.toLocaleString();
        };

        const yAxisConfig = {
            grid: true,
            domain: yDomainMax ? [0, yDomainMax] : undefined,
            tickFormat: formatDecimalMan // Use custom formatter
        };

        return Plot.plot({
            height: height,
            width: width,
            marginLeft: MARGIN_LEFT,
            marginRight: MARGIN_RIGHT,
            style: { overflow: "hidden", background: "white", cursor: isDragging ? "grabbing" : "grab" },
            color: { legend: true, type: "ordinal", scheme: "Tableau10" },
            y: yAxisConfig,
            x: {
                grid: true,
                domain: domainX || undefined,
                label: "Time From End (hrs)",
            },
            marks: [
                Plot.axisX({
                    anchor: "bottom",
                    label: "Time From End (hrs)",
                    interval: 24,
                }),
                Plot.gridX({ interval: 12 }),
                Plot.axisY({
                    anchor: "left",
                    label: "Event Points",
                    tickFormat: formatDecimalMan // Apply to axis mark too
                }),
                Plot.axisY({
                    anchor: "right",
                    label: "Event Points",
                    tickFormat: formatDecimalMan
                }),
                Plot.ruleY([0]),
                Plot.ruleX([0], {
                    stroke: "#666",
                    strokeOpacity: 0.5,
                    strokeDasharray: "3 2",
                }),
                Plot.ruleX([18], { strokeOpacity: 0 }),
                Plot.ruleX(
                    [timeToCurrentEventEnd],
                    {
                        stroke: "red",
                        strokeWidth: 1,
                    }),
                Plot.dot(
                    filteredData, Plot.selectLast({
                        filter: e => e.t === "r",
                        x: "tfe",
                        y: "ep",
                        fill: "b",
                        symbol: "circle",
                        strokeWidth: 0,
                        fillOpacity: 1,
                        r: 2,
                    })),
                Plot.line(
                    filteredData, {
                    filter: e => e.t === "r",
                    x: "tfe",
                    y: "ep",
                    z: "b",
                    stroke: "b",
                    strokeWidth: 2,
                }),
                Plot.area(
                    filteredData, {
                    filter: e => e.t === "p" && e.l > 0,
                    x1: "tfe",
                    y1: "l",
                    y2: "u",
                    z: "b",
                    stroke: "b",
                    strokeWidth: 0.5,
                    strokeOpacity: 0.8,
                    fill: "b",
                    fillOpacity: 0.1,
                }),
                Plot.line(
                    filteredData, {
                    filter: e => e.t === "p",
                    x: "tfe",
                    y: "ep",
                    z: "b",
                    stroke: "b",
                    strokeWidth: 1.5,
                    strokeDasharray: "4 3",
                }),
                Plot.area(
                    filteredData, {
                    filter: e => e.t === "h" && e.l > 0,
                    x1: "tfe",
                    y1: "l",
                    y2: "u",
                    z: "b",
                    stroke: "b",
                    strokeWidth: 0.5,
                    strokeOpacity: 0.4,
                    fill: "b",
                    fillOpacity: 0.05,
                }),
                Plot.line(
                    filteredData, {
                    filter: e => e.t === "h",
                    x: "tfe",
                    y: "ep",
                    z: "b",
                    stroke: "b",
                    strokeWidth: 1.5,
                    strokeDasharray: "4 3",
                    strokeOpacity: 0.5,
                }),
                Plot.crosshair(filteredData, { x: "tfe", y: "ep" }),

                Plot.text(filteredData,
                    Plot.selectFirst({
                        filter: e => e.t === "h",
                        x: "tfe",
                        y: "ep",
                        z: "b",
                        text: e => `과거 예측컷 (T${e.b})`,
                        textAnchor: "end",
                        dx: -5,
                    })),

                Plot.text(
                    [[timeToCurrentEventEnd, 0]],
                    {
                        text: ["Now: " + timeToCurrentEventEnd.toFixed(1)],
                        textAnchor: "start",
                        dy: -6,
                        dx: 3
                    }),

                Plot.tip(
                    filteredData.map(d => ({ ...d, "랭킹": d.b })),
                    Plot.pointer({
                        filter: e => e.t === "r",
                        x: "tfe",
                        y: "ep",
                        channels: {
                            "랭킹": { value: "랭킹", scale: "color" },
                            "남은시간": "tfe",
                            "이벤포": "ep"
                        },
                        format: {
                            "랭킹": d => `${d}위`,
                            "남은시간": d => d.toFixed(1),
                            "이벤포": d => Math.round(d).toLocaleString(),
                            x: false,
                            y: false,
                            stroke: false,
                        },
                        anchor: "bottom-right",
                        tip: true,
                        maxRadius: 10,
                    })),

                Plot.tip(
                    filteredData,
                    Plot.pointer({
                        filter: e => e.t === "p" && e.l > 0,
                        x: "tfe",
                        y: "ep",
                        channels: {
                            "랭킹": e => `${e.b}위 (예측)`,
                            "남은시간": "tfe",
                            "예측범위": e => `${formatDecimalMan(e.l)}~\n${formatDecimalMan(e.u)}`
                        },
                        format: {
                            "랭킹": true,
                            "남은시간": d => d.toFixed(1),
                            "예측범위": true,
                            x: false,
                            y: false,
                            stroke: false,
                        },
                        anchor: "bottom-right",
                        tip: true,
                        maxRadius: 15,
                    })),
            ],
        });
    };


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-0 md:p-4 animate-fade-in">
            <div
                ref={modalRef}
                className="bg-white rounded-none md:rounded-2xl shadow-2xl w-full max-w-6xl max-h-[100dvh] md:max-h-[90vh] overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="px-4 md:px-10 py-3 md:py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                        </svg>
                        Ranking Trends
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500 hover:text-gray-700"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-2 py-2 md:p-10 bg-white min-h-[400px] relative">
                    {loading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10">
                            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
                            <span className="text-gray-500 font-medium">Loading data...</span>
                        </div>
                    )}

                    {error && (
                        <div className="flex flex-col items-center justify-center h-full text-red-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    <div
                        ref={contentRef}
                        className="flex flex-col gap-8 relative graph-container"
                        style={{ touchAction: "none" }}
                        onWheel={handleWheel}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    ></div>
                </div>
            </div>
        </div>
    );
};

export default RankingGraphModal;
