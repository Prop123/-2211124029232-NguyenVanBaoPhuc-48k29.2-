document.addEventListener("DOMContentLoaded", () => {
    d3.csv("data.csv").then(function(data) {
        console.log("Dữ liệu đã load:", data);

        if (!data.length || !data[0]["Thời gian tạo đơn"] || !data[0]["Mã đơn hàng"] || !data[0]["Mã nhóm hàng"] || !data[0]["Tên nhóm hàng"]) {
            console.error("⚠️ Tên cột không đúng hoặc dữ liệu trống! Kiểm tra file CSV.");
            return;
        }
        const parsedData = data.map(d => ({
            month: `Tháng ${(new Date(d["Thời gian tạo đơn"]).getMonth() + 1).toString().padStart(2, '0')}`,
            category: `[${d["Mã nhóm hàng"]}] ${d["Tên nhóm hàng"]}`,
            orderID: d["Mã đơn hàng"]
        }));

        const groupedByCategory = d3.rollups(parsedData, 
            v => new Set(v.map(d => d.orderID)).size, 
            d => d.month, 
            d => d.category
        );
        let dataset = [];
        const totalOrdersPerMonth = d3.rollups(parsedData, 
            v => new Set(v.map(d => d.orderID)).size, 
            d => d.month
        );

        const totalOrdersMap = new Map(totalOrdersPerMonth);

        groupedByCategory.forEach(([month, categories]) => {
            categories.forEach(([category, count]) => {
                dataset.push({
                    month,
                    category,
                    probability: count / totalOrdersMap.get(month) //
                });
            });
        });
        const categories = Array.from(new Set(dataset.map(d => d.category)));
        const pivotData = d3.groups(dataset, d => d.month)
            .map(([month, values]) => {
                let obj = { month };
                values.forEach(v => obj[v.category] = v.probability);
                return obj;
            });

        const margin = { top: 60, right: 120, bottom: 60, left: 80 };
        const width = 1000 - margin.left - margin.right;
        const height = 500;

        d3.select("#Q8").selectAll("svg").remove();

        const svg = d3.select("#Q8")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);

        svg.append("text")
            .attr("x", width / 2)
            .attr("y", -20)
            .attr("text-anchor", "middle")
            .style("font-size", "20px")
            .style("font-weight", "bold")
            .style("fill", "#009688")
            .text("Xác suất bán hàng của Nhóm hàng theo Tháng");

        const x = d3.scalePoint()
            .domain(pivotData.map(d => d.month))
            .range([0, width])
            .padding(0.5);

        const y = d3.scaleLinear()
            .domain([0, d3.max(dataset, d => d.probability)])
            .nice()
            .range([height, 0]);

        svg.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .style("font-size", "12px")
            .style("fill", "black");

        svg.append("g")
            .call(d3.axisLeft(y).tickFormat(d => `${(d * 100).toFixed(1)}%`))
            .selectAll("text")
            .style("font-size", "12px");

        const color = d3.scaleOrdinal(d3.schemeCategory10).domain(categories);

        categories.forEach(category => {
            const line = d3.line()
                .x(d => x(d.month))
                .y(d => y(d[category] || 0));

            svg.append("path")
                .datum(pivotData)
                .attr("fill", "none")
                .attr("stroke", color(category))
                .attr("stroke-width", 2)
                .attr("d", line);

            svg.selectAll(`.dot-${category}`)
                .data(pivotData)
                .enter()
                .append("circle")
                .attr("cx", d => x(d.month))
                .attr("cy", d => y(d[category] || 0))
                .attr("r", 4)
                .attr("fill", color(category));
        });

       
        const legend = svg.append("g")
            .attr("transform", `translate(${width + 20}, 0)`);

        categories.forEach((category, i) => {
            const legendRow = legend.append("g")
                .attr("transform", `translate(0, ${i * 20})`);

            legendRow.append("rect")
                .attr("width", 10)
                .attr("height", 10)
                .attr("fill", color(category));

            legendRow.append("text")
                .attr("x", 15)
                .attr("y", 10)
                .attr("text-anchor", "start")
                .style("font-size", "12px")
                .text(category);
        });

    }).catch(error => console.error("❌ Lỗi khi đọc CSV:", error));
});
