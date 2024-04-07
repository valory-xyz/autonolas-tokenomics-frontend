import fs from 'fs';
import * as wagmiChains from "wagmi/chains";

const main = async() => {
    console.log(wagmiChains)
    const chaindIdsObject = Object.entries(wagmiChains).reduce((acc, [chainSlug, {id}]) => {
        return Object.assign(acc, {[chainSlug]: id});
    }, {});
    fs.writeFile("./output/chain-ids.json", JSON.stringify(chaindIdsObject, null, 2), (err) => {
        if (err) {
            console.error(err);
        }
    });
}

main();