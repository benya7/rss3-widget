import { h, } from 'preact';
import { useContext, useState, useEffect } from 'preact/hooks';
import style from './home.css';
import { ConfigContext, ServiceContext } from '../AppContext';
import { Action, Media, Note, Token, WidgetApi } from '../models';
import parseDate from '../utils/parseDate';
import getTextByTag from '../utils/getTextByTag';
import formatAccount from '../utils/formatAccount';
import { BsFillPlayBtnFill } from "react-icons/bs";
import clsx from 'clsx';


const Home = () => {
  const config = useContext(ConfigContext);
  const service = useContext(ServiceContext);
  const [notes, setNotes] = useState<Note[]>([]);
  const [cursor, setCursor] = useState<string | undefined>("");
  const [ensList, setEnsList] = useState<{ [key: string]: string; }>({})
  const [loading, setLoading] = useState(true)

  const addEns = (ens: string, address: string) => {
    setEnsList((prev) => {
      return {
        ...prev,
        [address]: ens
      }
    })
  }

  const getNotes = async (service: WidgetApi) => {
    if (config.accounts.length == 1) {
      const { result, cursor: nextCursor, total } =
        await service.getNotesByInstance(
          config.accounts[0],
          {
            network: config.networks,
            tag: config.tags,
            limit: config.limit,
            platform: config.platforms,
            cursor: cursor
          })
      setNotes((prev) => { return [...prev, ...result] })
      if (total < config.limit) {
        setCursor(undefined)
      } else {
        setCursor(nextCursor)
      }
      console.log(result)
    }
    else if (config.accounts.length > 1) {
      const { result, cursor: nextCursor, total } = 
      await service.getNotesByList({ 
        address: config.accounts, 
        network: config.networks,
        tag: config.tags, 
        limit: config.limit,
        platform: config.platforms, 
        cursor: cursor 
      })
      setNotes((prev) => { return [...prev, ...result] })
      if (total < config.limit) {
        setCursor(undefined)
      } else {
        setCursor(nextCursor)
      }
      console.log(result)
    } else return
  }

  useEffect(() => {
    if (!service) return;
    getNotes(service).then(() => console.log("fetching notes"))
  }, [service]);

  useEffect(() => {
    if (!service || !(notes.length > 0)) return;
    for (let i = 0; i < notes.length; i++) {
      const addressFrom = notes[i].address_from;
      const adrressTo = notes[i].actions[0].address_to || notes[i].address_to;
      if (!(addressFrom in ensList)) {
        service.getProfileByInstance(addressFrom).then((response: any) => {
          if (response.total > 0) addEns(response.result[0].handle, response.result[0].address);
          else addEns(addressFrom, addressFrom);;
        })
      }
      if (!(adrressTo in ensList)) {
        service.getProfileByInstance(adrressTo).then((response: any) => {
          if (response.total > 0) addEns(response.result[0].handle, response.result[0].address);
          else addEns(adrressTo, adrressTo);;
        })
      }
    }
    setLoading(false)
  }, [service, notes])

  return (
    <div className={style.main}>
      {loading && <p>Loading...</p>}
      {!loading &&
        notes.map((note) => (
          <div className={style.note}>
            <div className={style.details}>
              <p>{note.network}</p>
              <p>{parseDate(note.timestamp)}</p>
            </div>
            <ActionItem note={note} ensList={ensList} />
          </div>
        ))
      }
      {!loading && cursor && <button onClick={() => {
        if (service)
          getNotes(service).then(() => console.log("fetching notes"))
      }}>load more</button>}
    </div >);
};


const ActionItem = ({ note, ensList }: { note: Note; ensList: any }) => {
  if (note.tag == "transaction" && note.type == "transfer") {
    return (
      <div>
        <div className={style.action}>
          <p className={style.bold}>{formatAccount(note.address_from, ensList)}</p>
          <p className={style.fs90}>{getTextByTag(note.tag, note.type)}</p>
          <p className={style.bold}>{formatAccount(note.address_to, ensList)}</p>
        </div>
        <div className={style.metadata}>
          <img src={note.actions[0].metadata.image} alt="" />
          <p>{note.actions[0].metadata.value_display?.substring(0, 6)}</p>
          <p className={style.bold}>{note.actions[0].metadata.symbol}</p>
        </div>
      </div>
    )
  } else if (note.tag == "exchange" && (note.type == "swap" || note.type == "liquidity" || note.type == "withdraw")) {
    return (
      <div>
        <div className={style.action}>
          <p className={style.bold}>{formatAccount(note.address_from, ensList)}</p>
          <p className={style.fs90}>{getTextByTag(note.tag, note.type)}</p>
          <p className={style.bold}>{note.actions[0].metadata.protocol}</p>
        </div>
        {note.type == "swap" ?
          <div className={style.metadata}>
            <img src={note.actions[0].metadata.from?.image} alt="" />
            <img src={note.actions[0].metadata.to?.image} alt="" />
            <p>{note.actions[0].metadata.from?.value_display?.substring(0, 6)}</p>
            <p className={style.bold}>{note.actions[0].metadata.from?.symbol}</p>
            <p className={style.fs90}>for</p>
            <p>{note.actions[0].metadata.to?.value_display?.substring(0, 6)}</p>
            <p className={style.bold}>{note.actions[0].metadata.to?.symbol}</p>
          </div>
          :
          <div>
            {note.actions[0].metadata.tokens?.map((token: Token) => (
              <div className={style.metadata}>
                <img src={token.image} alt="" />
                <p>{token.value_display}</p>
                <p className={style.bold}>{token.symbol}</p>
              </div>
            ))
            }
          </div>
        }
      </div>
    )
  } else if (note.tag == "social") {
    return (
      <div>
        <div className={style.action}>
          <p className={style.bold}>{formatAccount(note.address_from, ensList)}</p>
          <p className={style.fs90}>{getTextByTag(note.tag, note.type)}</p>
          <p className={style.bold}>{note.actions[0].platform}</p>
        </div>

        <a href={
          note.type == "post" ? (
            note.actions[0].related_urls.length > 1 ? note.actions[0].related_urls[1] : note.actions[0].related_urls[0]
          ) : note.actions[0].metadata.target?.target_url
        } target="_blank">
          <p className={style.fs90}>{note.actions[0].metadata.title ? note.actions[0].metadata.title : note.actions[0].metadata.body}</p>
          <div className={style.metadata}>
            <div className={style.target}>

              {
                note.actions[0].metadata.target?.media &&
                <MediaItem media={note.actions[0].metadata.target?.media[0]} />
              }
              <p className={style.fs75}>{note.actions[0].metadata.target?.body}</p>
            </div>
          </div>
        </a>
      </div>
    )
  } else if (note.tag == "donation") {
    return (
      <div>
        <div className={style.action}>
          <p className={style.bold}>{formatAccount(note.address_from, ensList)}</p>
          <p className={style.fs90}>{getTextByTag(note.tag, note.type)}</p>
          <p className={style.bold}>{note.actions[0].metadata.token?.value_display?.substring(0, 5)}</p>
          <p className={style.bold}>{note.actions[0].metadata.token?.symbol}</p>
        </div>
        <a href={note.actions[0].related_urls[1]} target="_blank">
          <div className={style.metadata}>
            <div className={style.target}>
              <img src={note.actions[0].metadata.logo} alt="" />
              <div>
                <p className={style.fs90}>{note.actions[0].metadata.title}</p>
                <p className={style.fs75}>{note.actions[0].metadata.description}</p>
              </div>
            </div>
          </div>
        </a>
      </div>
    )
  } else if (note.tag == "collectible" && (note.type == "trade" || note.type == "mint" || note.type == "transfer")) {
    return (
      <div>
        <div className={style.action}>
          <p className={style.bold}>{formatAccount(note.type != "mint" ? note.address_from : note.address_to, ensList)}</p>
          <p className={style.fs90}>{getTextByTag(note.tag, note.type)}</p>
          {note.type != "mint" && <p className={style.bold}>{formatAccount(note.address_to, ensList)}</p>}
        </div>
        {note.type == "trade" &&
          <div className={style.action}>
            <p className={style.fs90}>for</p>
            <p>{note.actions[0].metadata.cost?.value_display}</p>
            <p className={style.bold}>{note.actions[0].metadata.cost?.symbol}</p>
          </div>
        }
        <a href={note.actions[0].related_urls[1]} target="_blank">
          <div className={style.metadata}>
            <div className={style.target}>
              <img src={
                note.actions[0].metadata.image?.startsWith("ipfs://") ?
                  `https://ipfs.io/ipfs/${note.actions[0].metadata.image.split("//")[1]}` :
                  note.actions[0].metadata.image
              } alt="" />
              <div>
                <p className={style.fs75}>{note.actions[0].metadata.collection}</p>
                <p className={clsx([style.fs90, style.bold])}>{note.actions[0].metadata.name}</p>
                <p className={style.fs75}>{note.actions[0].metadata.description}</p>
              </div>
            </div>
          </div>
        </a>
      </div>
    )
  } else if (note.tag == "governance" && note.type == "vote") {
    return (
      <div>
        <div className={style.action}>
          <p className={style.bold}>{formatAccount(note.address_from, ensList)}</p>
          <p className={style.fs90}>{getTextByTag(note.tag, note.type)}</p>
          <p className={style.bold}>{note.actions[0].metadata.proposal?.organization.name}</p>
        </div>
        <a href={note.actions[0].related_urls[0]} target="_blank">
          <div className={style.metadata}>
            <div className={style.target}>
              <div>
                <p className={clsx([style.fs90, style.bold])}>{note.actions[0].metadata.proposal?.title}</p>
                <p className={style.fs75}>{note.actions[0].metadata.proposal?.body}</p>
              </div>
            </div>
          </div>
        </a>
      </div>
    )
  }
  else {
    return <div>working..</div>
  }
}

const MediaItem = ({ media }: { media: Media }) => {
  if (media.mime_type.startsWith("image")) {
    return (
      <img src={media.address} alt="" />
    )
  } else return <BsFillPlayBtnFill />
}

export default Home;
