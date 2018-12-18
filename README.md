### Proof-of-Distance
give "random name" to each "node"<br/>
check distance of "miner node name" and "block hash"<br/>
choose the smallest block<br/>

### TimeLine
1. new block "Block A" created
2. "some one" make "Request A" to became a node
3. new block "Block B" created ("Request A" is in "Block B")
4. now "some one" became a node ("node name" = hash("Block B".header + hash("Request A"))) //<-- something like this

### ToDo
1. improve chain choose algorithm(Done)
2. add distance calc to block(Done)
3. add Comment(it's too dirty)(Done)
4. rebuild whole system(it's too dirty too)
5. add code update transaction

### Current System
	+------------------\-------------------\----------------+-+
	|    Protocol     <->   SocketServer    \  HttpServer   | |
	+------------------\---------------------\--------------+ |FrontEnd
	|                      BlockChain                       | |
	+-----+---+-----------------+------------+-------+------+-+
	|     |   | TransactionPool | ChainState | Chain | Mine | |
	|     |   + ----------------+------------+-------+------+ |
	|     |             Transaction          |    Block     | |BackEnd
	|     +----------------------------------+------+-------+ |
	|                     Wallet                    | Coord | |
	+-----------------------------------------------+-------+-+