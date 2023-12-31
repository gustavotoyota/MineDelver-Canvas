import { pull } from 'lodash';
import { Vec3 } from 'src/code/misc/vec3';
import { Ref } from 'vue';

import { ICellData } from '../../../app/grid/cells';
import { Grid3 } from '../../grid/grid3';
import { IEntity } from '../entities';

export interface ICellEntity extends IEntity {
  worldPos: Ref<Vec3>;
}

export abstract class CellEntity implements ICellEntity {
  abstract worldPos: Ref<Vec3>;

  abstract setup(): void;

  protected abstract _grid: Grid3<ICellData>;

  move(input: { targetPos: Vec3 }) {
    const newCell = this._grid.getCell(input.targetPos);

    if (newCell === undefined) {
      throw new Error('New cell is undefined');
    }

    const oldCell = this._grid.getCell(this.worldPos.value);

    if (oldCell === undefined) {
      throw new Error('Cell is undefined');
    }

    pull(oldCell.entities ?? [], this);

    if (oldCell.entities?.length === 0) {
      delete oldCell.entities;
    }

    newCell.entities ??= [];
    newCell.entities.push(this);

    this.worldPos.value = input.targetPos;
  }
}
