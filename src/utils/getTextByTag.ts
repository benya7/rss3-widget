export default function getTextByTag(tag: string, type: string): string {
  switch (tag) {
    case "transaction":
      switch (type) {
        case "transfer":
          return "sent to"
        case "mint":
          return "mint"
        case "burn":
          return "burn"
        case "bridge":
          return "bridge"
        default:
          break;
      }
    case "social":
      switch (type) {
        case "post":
          return "posted a note";
        case "revise":
          return "revise";
        case "comment":
          return "made a comment on";
        case "share":
          return "shared a note";
        case "profile":
          return "profile";
        default:
          break;
      }
      return "posted a note"
    case "collectible":
      switch (type) {
        case "transfer":
          return "sent an NFT to";    
        case "trade":
          return "sold an NFT to";
        case "mint":
          return "minted an NFT";
        case "burn":
          return "burn";
        case "poap":
          return "poap"
        default:
          break;
      }
    case "donation":
      switch (type) {
        case "launch":
          return "launch";
        case "donate":
          return "donated";
        default:
          break;
      }
    case "exchange":
      switch (type) {
        case "withdraw":
          return "withdrew liquidity on";   
        case "deposit":
          return "deposit";
        case "swap":
          return "swaped on";
        case "liquidity":
          return "supplied liquidity on";
        default:
          break;
      }
    case "governance":
      switch (type) {
        case "propose":
          return "propose";
        case "vote":
          return "voted a proposal on";
        default:
          break;
      }
    default:
      return "";
  }
}