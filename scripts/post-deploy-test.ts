import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";

// Ensure region is set
const region = process.env.AWS_REGION || "eu-west-2";

const client = new EventBridgeClient({ region });

const detail = {
  customerId: "karl-001",
  items: [{ sku: "JERS-1023", quantity: 2 }],
  _postDeployTest: true
};

const event = {
    Source: "order.service",
    DetailType: "OrderPlaced",
    EventBusName: "pulsequeue-bus",
    Detail: JSON.stringify({
      customerId: "test",
      items: [{ sku: "debug", quantity: 1 }],
      _postDeployTest: true
    })
  };

(async () => {
  try {
    const command = new PutEventsCommand({ Entries: [event] });
    const result = await client.send(command);

    if (result.FailedEntryCount && result.FailedEntryCount > 0) {
      console.error("❌ Event submission failed:", result.Entries);
      process.exit(1);
    }

    console.log("✅ EventBridge test event successfully sent:", result.Entries);
  } catch (err) {
    console.error(`
❌ Failed to send EventBridge event
-----------------------------------
Reason: ${err instanceof Error ? err.message : err}
`);
    process.exit(1);
  }
})();