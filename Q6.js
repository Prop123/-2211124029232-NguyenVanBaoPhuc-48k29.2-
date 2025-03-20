document.addEventListener("DOMContentLoaded", () => {
    d3.csv("data.csv").then(function(data) {
        console.log("Dữ liệu đã load:", data);

        if (!data.length || !data[0]["Thời gian tạo đơn"] || !data[0]["Thành tiền"]) {
            console.error("⚠️ Tên cột không đúng hoặc dữ liệu trống! Kiểm tra file CSV.");
            return;
        }

        const parsedData = data.map(d => {
            const date = new Date(d["Thời gian tạo đơn"]);
            const hour = date.getHours();
            return {
                timeSlot: `${hour.toString().padStart(2, '0')}:00-${hour.toString().padStart(2, '0')}:59`,
                revenue: +d["Thành tiền"],
                date: date.toISOString().split('T')[0]
            };
        });

        
        const groupedByTimeSlot = d3.rollups(parsedData, 
            v => ({
                totalRevenue: d3.sum(v, d => d.revenue),
                uniqueDays: new Set(v.map(d => d.date)).size
            }),
            d => d.timeSlot
        );

        
        const dataset = groupedByTimeSlot.map(([timeSlot, values]) => ({
            timeSlot: timeSlot,
            revenue: values.totalRevenue / values.uniqueDays
        })).sort((a, b) => a.timeSlot.localeCompare(b.timeSlot, undefined, { numeric: true }));

        const margin = { top: 60, right: 100, bottom: 80, left: 100 };
        const width = 1200 - margin.left - margin.right;
        const height = 500;

        d3.select("#Q6").selectAll("svg").remove();

        const svg = d3.select("#Q6")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);

        svg.append("text")
            .attr("x", width / 2)
            .attr("y", -20)
            .attr("text-anchor", "middle")
            .style("font-size", "22px")
            .style("font-weight", "bold")
            .style("fill", "#009688")
            .text("Doanh số bán hàng trung bình theo Khung giờ");

        const x = d3.scaleBand()
            .domain(dataset.map(d => d.timeSlot))
            .range([0, width])
            .padding(0.3);

        const y = d3.scaleLinear()
            .domain([0, d3.max(dataset, d => d.revenue)])
            .nice()
            .range([height, 0]);

        svg.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(x).tickSize(0).tickPadding(10))
            .selectAll("text")
            .style("font-size", "10px")
            .style("fill", "black")
            .attr("text-anchor", "middle")  
            .attr("dy", "1em"); 

        svg.append("g")
            .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${d3.format(",.0f")(d / 1e3)}K`))
            .selectAll("text")
            .style("font-size", "14px");

        svg.selectAll(".bar")
            .data(dataset)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => x(d.timeSlot))
            .attr("y", d => y(d.revenue))
            .attr("width", x.bandwidth())
            .attr("height", d => height - y(d.revenue))
            .attr("fill", (d, i) => d3.schemeCategory10[i % 10]);

        // Label trên cột (Định dạng `giá trị + K`)
        svg.selectAll(".label")
            .data(dataset)
            .enter()
            .append("text")
            .attr("x", d => x(d.timeSlot) + x.bandwidth() / 2)
            .attr("y", d => y(d.revenue) + x.bandwidth() / 2)
            .attr("text-anchor", "middle")
            .style("font-size", "10px")
            .style("fill", "white")
            .style("font-weight", "bold")
            .text(d => `${d3.format(",.1f")(d.revenue / 1e3)}K`);

    }).catch(error => console.error("❌ Lỗi khi đọc CSV:", error));
});
