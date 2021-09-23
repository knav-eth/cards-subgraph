import { BigInt } from "@graphprotocol/graph-ts"
import { AdventureCards, Transfer as TransferEvent } from "../generated/AdventureCards/AdventureCards"
import { AdventureCardPack, Transfer, Wallet } from "../generated/schema"

export function handleTransfer(event: TransferEvent): void {
  let fromAddress = event.params.from
  let toAddress = event.params.to
  let tokenId = event.params.tokenId
  let fromId = fromAddress.toHex()
  let fromWallet = Wallet.load(fromId)

  if (!fromWallet) {
    fromWallet = new Wallet(fromId)
    fromWallet.address = fromAddress
    fromWallet.joined = event.block.timestamp
    fromWallet.heldCount = BigInt.fromI32(0)
    fromWallet.save()
  } else {
    if (!isZeroAddress(fromId)) {
      fromWallet.heldCount = fromWallet.heldCount.minus(BigInt.fromI32(1))
      fromWallet.save()
    }
  }

  let toId = toAddress.toHex()
  let toWallet = Wallet.load(toId)
  if (!toWallet) {
    toWallet = new Wallet(toId)
    toWallet.address = toAddress
    toWallet.joined = event.block.timestamp
    toWallet.heldCount = BigInt.fromI32(1)
    toWallet.save()
  } else {
    toWallet.heldCount = toWallet.heldCount.plus(BigInt.fromI32(1))
    toWallet.save()
  }

  let adventureCardPack = AdventureCardPack.load(tokenId.toString())
  if (adventureCardPack == null) {
    adventureCardPack = new AdventureCardPack(tokenId.toString())
    let contract = AdventureCards.bind(event.address)

    adventureCardPack.numericId = tokenId.toI32()
    adventureCardPack.name = "Adventure Cards #" + tokenId.toString()
    adventureCardPack.metadata = contract.tokenURI(tokenId)
    adventureCardPack.minted = event.block.timestamp

    let cards: Array<string> = []
    for (let i = 0; i < 45; i++) {
      cards.push(contract.getCardTitle(tokenId, BigInt.fromI32(i)))
    }
    adventureCardPack.cards = cards
  }
  adventureCardPack.owner = event.params.to
  adventureCardPack.currentOwner = toWallet.id
  adventureCardPack.save()

  let transfer = new Transfer(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString(),
  )

  transfer.pack = tokenId.toString()
  transfer.from = fromWallet.id
  transfer.to = toWallet.id
  transfer.txHash = event.transaction.hash
  transfer.timestamp = event.block.timestamp
  transfer.save()
}

function isZeroAddress(string: string): boolean {
  return string == "0x0000000000000000000000000000000000000000"
}
