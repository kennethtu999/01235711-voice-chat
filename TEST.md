curl -X POST \
 http://localhost:5680/webhook/2617c1b1-ef07-4e6a-af08-2d9ac0128621/chat \
 -H 'Content-Type: application/json' \
 -d '{"action": "sendMessage", "chatInput": "說個笑話聽聽"}'



http://localhost:5678/webhook/30b09695-0f2e-48a6-acba-3abdef6393c0/chat

curl -X POST \
 http://localhost:5680/webhook/30b09695-0f2e-48a6-acba-3abdef6393c0/chat \
 -H 'Content-Type: application/json' \
 -d '{"action": "sendMessage", "chatInput": "說個笑話聽聽"}'


curl -X POST \
 https://clouldflare-route.kenneth-tu.workers.dev/api/messages \
 -H 'Content-Type: application/json' \
 -d '{"action": "sendMessage", "chatInput": "說個笑話聽聽"}'


curl -X POST \
 http://localhost:8787/api/messages \
 -H 'Content-Type: application/json' \
 -d '{"action": "sendMessage", "chatInput": "說個笑話聽聽"}'
