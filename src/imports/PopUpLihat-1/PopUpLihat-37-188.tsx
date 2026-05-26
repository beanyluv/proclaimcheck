import imgIlideInfoContohLaporanPelaksanaanKegiatanPr043F77156Db9531343E781B630Fe4D09Page00011 from "./8bd04a26572d19cf264534e5787a71d3b5a520ba.png";
import imgIlideInfoContohLaporanPelaksanaanKegiatanPr043F77156Db9531343E781B630Fe4D09Page00021 from "./708bdd386fbca4343493213319ccd2c4dc82fd5d.png";

function Heading() {
  return (
    <div className="h-[27px] relative shrink-0 w-full" data-name="Heading 3">
      <p className="absolute font-['Mukta:Regular',sans-serif] leading-[27px] left-0 not-italic text-[18px] text-white top-[0.2px] whitespace-nowrap">Laporan Kegiatan Edukasi/ Penyuluhan dan Senam Prolanis</p>
    </div>
  );
}

function Container() {
  return (
    <div className="absolute bg-[#1f6f5f] content-stretch flex flex-col h-[59px] items-start left-0 pt-[16px] px-[24px] rounded-tl-[10px] rounded-tr-[10px] top-0 w-[600px]" data-name="Container">
      <Heading />
    </div>
  );
}

function Frame() {
  return (
    <div className="absolute h-[536px] left-[11px] overflow-x-auto overflow-y-clip pointer-events-none top-[30px] w-[577px]">
      <div className="absolute h-[536px] left-[82px] top-0 w-[414px]" data-name="ilide.info-contoh-laporan-pelaksanaan-kegiatan-pr_043f77156db9531343e781b630fe4d09_page-0001 1">
        <img alt="" className="absolute inset-0 max-w-none object-cover size-full" src={imgIlideInfoContohLaporanPelaksanaanKegiatanPr043F77156Db9531343E781B630Fe4D09Page00011} />
        <div aria-hidden="true" className="absolute border border-black border-solid inset-0" />
      </div>
      <div className="absolute h-[536px] left-[82px] top-[536px] w-[414px]" data-name="ilide.info-contoh-laporan-pelaksanaan-kegiatan-pr_043f77156db9531343e781b630fe4d09_page-0002 1">
        <img alt="" className="absolute inset-0 max-w-none object-cover size-full" src={imgIlideInfoContohLaporanPelaksanaanKegiatanPr043F77156Db9531343E781B630Fe4D09Page00021} />
        <div aria-hidden="true" className="absolute border border-black border-solid inset-0" />
      </div>
    </div>
  );
}

function Button() {
  return (
    <div className="bg-[#1f6f5f] h-[37px] relative rounded-[8px] shrink-0 w-[85.925px]" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="-translate-x-1/2 absolute font-['Mukta:Regular',sans-serif] leading-[21px] left-[43px] not-italic text-[14px] text-center text-white top-[8.4px] whitespace-nowrap">Kembali</p>
      </div>
    </div>
  );
}

function Container2() {
  return (
    <div className="absolute content-stretch flex h-[37px] items-start justify-end left-[24px] top-[588px] w-[549px]" data-name="Container">
      <Button />
    </div>
  );
}

function Container1() {
  return (
    <div className="absolute h-[566px] left-0 top-[59px] w-[600px]" data-name="Container">
      <Frame />
      <Container2 />
    </div>
  );
}

function PopUpLihat1() {
  return (
    <div className="bg-white h-[597px] relative rounded-[10px] shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.1),0px_8px_10px_-6px_rgba(0,0,0,0.1)] shrink-0 w-[600px]" data-name="Pop Up Lihat">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid overflow-clip relative rounded-[inherit] size-full">
        <Container />
        <Container1 />
      </div>
    </div>
  );
}

export default function PopUpLihat() {
  return (
    <div className="bg-[rgba(0,0,0,0.35)] content-stretch flex items-center justify-center px-[353.6px] relative rounded-[10px] size-full" data-name="Pop Up-Lihat">
      <PopUpLihat1 />
    </div>
  );
}