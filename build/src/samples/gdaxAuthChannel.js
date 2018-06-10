"use strict";
/**********************************************************************************************************************
 * @license                                                                                                           *
 * Copyright 2017 Coinbase, Inc.                                                                                      *
 *                                                                                                                    *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance     *
 * with the License. You may obtain a copy of the License at                                                          *
 *                                                                                                                    *
 * http://www.apache.org/licenses/LICENSE-2.0                                                                         *
 *                                                                                                                    *
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on*
 * an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the                 *
 * License for the specific language governing permissions and limitations under the License.                         *
 **********************************************************************************************************************/
Object.defineProperty(exports, "__esModule", { value: true });
const Logger_1 = require("../utils/Logger");
const gdaxFactories_1 = require("../factories/gdaxFactories");
// process.env["GDAX_KEY"] = "b1e3d1d7b87f1ab4269b3e19a43c3f12";
// process.env["GDAX_SECRET"] = "td5AZeSfDa5aflI6Fxn5CPPTXjVuIOWFiViTEy59pi5EHCnkESFnW4zjXVV8gl4ZEspYJ0dGpNpR+BL6Et6OLQ==";
// process.env["GDAX_PASSPHRASE"] = "6n61v8c10vh";
const logger = Logger_1.ConsoleLoggerFactory();
const options = {
    logger: logger,
    channels: ['matches', 'user'],
    auth: {
        key: process.env.GDAX_KEY,
        secret: process.env.GDAX_SECRET,
        passphrase: process.env.GDAX_PASSPHRASE
    },
    wsUrl: null,
    apiUrl: null
};
if (!options.auth.key || !options.auth.secret) {
    logger.log('error', 'API credentials are required for this demo');
    process.exit(1);
}
gdaxFactories_1.getSubscribedFeeds(options, ['BTC-USD', 'LTC-USD']).then((feed) => {
    feed.on('data', (msg) => {
        const level = msg.type === 'match' ? 'debug' : 'info';
        logger.log(level, `${msg.type} received`, msg);
    });
});
//# sourceMappingURL=gdaxAuthChannel.js.map