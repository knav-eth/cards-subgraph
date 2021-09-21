import { BigInt } from "@graphprotocol/graph-ts"
import { AdventureCards, Transfer } from "../generated/AdventureCards/AdventureCards"
import { AdventureCardPack } from "../generated/schema"

export function handleTransfer(event: Transfer): void {
  let tokenId = event.params.tokenId
  let adventureCardPack = AdventureCardPack.load(tokenId.toString())

  if (adventureCardPack == null) {
    adventureCardPack = new AdventureCardPack(tokenId.toString())

    let contract = AdventureCards.bind(event.address)
    adventureCardPack.name = "Adventure Cards #" + tokenId.toString()
    adventureCardPack.metadata = contract.tokenURI(tokenId)
    adventureCardPack.numericId = tokenId.toI32()

    let cards: Array<string> = []
    for (let i = 0; i < 45; i++) {
      cards.push(contract.getCardTitle(tokenId, BigInt.fromI32(i)))
    }
    adventureCardPack.cards = cards
  }

  adventureCardPack.owner = event.params.to
  adventureCardPack.save()
}
