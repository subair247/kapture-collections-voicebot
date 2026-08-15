const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

const handleToolCalls = (req, res) => {
  try {
    const body = req.body || {};
    const message = body.message || body;
    const toolCalls =
      message.toolCalls ||
      message.toolCallList ||
      (body.toolCall ? [body.toolCall] : []);

    console.log("Incoming Payload:", JSON.stringify(body, null, 2));

    if (!toolCalls || toolCalls.length === 0) {
      return res.status(200).json({ status: "OK", message: "No tool calls detected" });
    }

    const results = toolCalls.map((tc) => {
      const toolId = tc.id || tc.toolCallId || "tool_call_default";
      const funcName = tc.function?.name || tc.name || "unknown";
      let args = tc.function?.arguments || tc.parameters || tc.arguments || {};

      if (typeof args === "string") {
        try {
          args = JSON.parse(args);
        } catch (e) {
          args = {};
        }
      }

      console.log(`Executing tool: ${funcName} with arguments:`, args);

      if (funcName === "verify_customer") {
        return {
          toolCallId: toolId,
          result: JSON.stringify({
            verified: true,
            customer_name: "Rahul Sharma",
            account_id: args.account_id || "ACC-98231",
            message: "Customer identity verified successfully."
          })
        };
      }

      if (funcName === "log_promise_to_pay") {
        return {
          toolCallId: toolId,
          result: JSON.stringify({
            status: "SUCCESS",
            ptp_date: args.ptp_date || "2026-08-21",
            amount: args.amount || 8499,
            message: "Promise to pay recorded successfully."
          })
        };
      }

      if (funcName === "send_payment_link") {
        return {
          toolCallId: toolId,
          result: JSON.stringify({
            status: "SENT",
            channel: args.channel || "SMS",
            link: "https://pay.kapturefinance.com/pay/acc98231"
          })
        };
      }

      if (funcName === "mark_disposition") {
        return {
          toolCallId: toolId,
          result: JSON.stringify({
            status: "UPDATED",
            disposition: args.status || "PTP_AGREED"
          })
        };
      }

      if (funcName === "escalate_to_agent") {
        return {
          toolCallId: toolId,
          result: JSON.stringify({
            status: "ESCALATED",
            department: "Human Collections / Hardship Desk",
            reason: args.reason || "HARDSHIP"
          })
        };
      }

      return {
        toolCallId: toolId,
        result: JSON.stringify({ status: "SUCCESS" })
      };
    });

    return res.status(200).json({ results });
  } catch (err) {
    console.error("Handler Error:", err);
    return res.status(200).json({
      results: [
        {
          toolCallId: req.body?.message?.toolCalls?.[0]?.id || "fallback_id",
          result: JSON.stringify({ status: "OK", verified: true })
        }
      ]
    });
  }
};

app.post("/webhook", handleToolCalls);
app.post("/", handleToolCalls);

app.get("/health", (req, res) => res.status(200).json({ status: "healthy" }));
app.get("/", (req, res) => res.send("Kapture Collections Server Running"));

app.listen(PORT, () => {
  console.log(`Mock server running on port ${PORT}`);
});