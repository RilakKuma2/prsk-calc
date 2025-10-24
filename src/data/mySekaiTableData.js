export const mySekaiTableData = {
    1000: [100, 82, 67, 54, 43, 34, 25, 18, 12],
    1500: [200, 173, 150, 131, 115, 100, 88, 77, 67],
    2000: [300, 264, 234, 208, 186, 167, 150, 136, 123],
    2500: [400, 355, 317, 285, 258, 234, 213, 195, 178],
    3000: [500, 446, 400, 362, 329, 300, 275, 253, 234],
    3500: [600, 537, 484, 439, 400, 367, 338, 312, 289],
    4000: [700, 628, 567, 516, 472, 434, 400, 371, 345],
    4500: [800, 719, 650, 593, 543, 500, 463, 430, 400],
    5000: [null, null, 734, 670, 615, 567, 525, 489, 456],
    5500: [null, null, null, 747, 686, 634, 588, 548, 512],
    6000: [null, null, null, null, 758, 700, 650, 606, 567],
    6500: [null, null, null, null, null, 767, 713, 665, 623],
    7000: [null, null, null, null, null, null, 775, 724, 678],
    7500: [null, null, null, null, null, null, null, 783, 734],
    8000: [null, null, null, null, null, null, null, null, 789],
};

export const powerColumnThresholds = [
    0, 4.5, 9.0, 13.5, 18.0, 22.5, 27.0, 31.5, 36.0,
];

export const scoreRowKeys = Object.keys(mySekaiTableData)
    .map(Number)
    .sort((a, b) => a - b);
