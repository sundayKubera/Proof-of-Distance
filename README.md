### Proof-of-Distance
give "random name" to each "node"
check distance of "miner node name" and "block hash"
choose the smallest block

### TimeLine
1. new block "Block A" created
2. "some one" make "Request A" to became a node
3. new block "Block B" created ("Request A" is in "Block B")
4. new block "Block C" created ("Request A" is not in "Block C")
5. now "some one" became a node ("node name" = hash("Block C".header + "Block B".header + hash("Request A"))) //<-- something like this