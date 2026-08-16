import { getSortableDelay } from "/scripts/utils.js";
import { QuickReplySetLink } from "./QuickReplySetLink.ts";
import { QuickReplySet } from "./QuickReplySet.ts";

export class QuickReplyConfig {
  setList: any[] = [];
  scope: any;

  onUpdate: any;
  onRequestEditSet: any;

  dom: any;
  setListDom: any;

  static from(props: any) {
    props.setList = props.setList?.map((it: any) => QuickReplySetLink.from(it))?.filter((it: any) => it.set) ?? [];
    const instance = Object.assign(new this(), props);
    instance.init();
    return instance;
  }

  init() {
    this.setList.forEach((it: any) => this.hookQuickReplyLink(it));
  }

  hasSet(qrs: any) {
    return this.setList.find((it: any) => it.set == qrs) != null;
  }
  addSet(qrs: any, isVisible = true) {
    if (!this.hasSet(qrs)) {
      const qrl = new QuickReplySetLink();
      qrl.set = qrs;
      qrl.isVisible = isVisible;
      this.hookQuickReplyLink(qrl);
      (this.setList as any[]).push(qrl);
      this.setListDom.append(qrl.renderSettings(this.setList.length - 1));
      this.update();
    }
  }
  removeSet(qrs: any) {
    const idx = this.setList.findIndex((it: any) => it.set == qrs);
    if (idx > -1) {
      this.setList.splice(idx, 1);
      this.update();
      this.updateSetListDom();
    }
  }

  renderSettingsInto(root: any) {
    this.setListDom = root.querySelector(".qr--setList");
    root.querySelector(".qr--setListAdd").addEventListener("click", () => {
      const newSet = QuickReplySet.list.find((qr: any) => !this.setList.find((qrl: any) => qrl.set == qr));
      if (newSet) {
        this.addSet(newSet);
      } else {
        toastr.warning("All existing QR Sets have already been added.");
      }
    });
    this.updateSetListDom();
  }
  updateSetListDom() {
    this.setListDom.innerHTML = "";
    $(this.setListDom).sortable({
      delay: getSortableDelay(),
      stop: () => this.onSetListSort(),
    });
    this.setList
      .filter((it: any) => !it.set.isDeleted)
      .forEach((qrl: any, idx: any) => this.setListDom.append(qrl.renderSettings(idx)));
  }

  onSetListSort() {
    this.setList = Array.from(this.setListDom.children).map((it: any, idx: any) => {
      const qrl = this.setList[Number((it as Element).getAttribute("data-order"))];
      qrl.index = idx;
      (it as Element).setAttribute("data-order", String(idx));
      return qrl;
    });
    this.update();
  }

  hookQuickReplyLink(qrl: any) {
    qrl.onDelete = () => this.deleteQuickReplyLink(qrl);
    qrl.onUpdate = () => this.update();
    qrl.onRequestEditSet = () => this.requestEditSet(qrl.set);
  }

  deleteQuickReplyLink(qrl: any) {
    this.setList.splice(this.setList.indexOf(qrl), 1);
    this.update();
  }

  update() {
    if (this.onUpdate) {
      this.onUpdate(this);
    }
  }

  requestEditSet(qrs: any) {
    if (this.onRequestEditSet) {
      this.onRequestEditSet(qrs);
    }
  }

  toJSON() {
    return {
      setList: this.setList,
    };
  }
}
