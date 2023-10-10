import { pull } from 'lodash';
import { Vec3 } from 'src/code/misc/vec3';
import { Ref } from 'vue';

import { ICellData } from '../../map/cells';
import { Grid } from '../../map/grid';
import { IEntity } from '../entities';

export interface ICellEntity extends IEntity {
  worldPos: Ref<Vec3>;
}

export abstract class CellEntity implements ICellEntity {
  abstract worldPos: Ref<Vec3>;

  abstract setup(): void;

  protected abstract _grid: Grid<ICellData>;

  move(input: { targetPos: Vec3 }) {
    const newCell = this._grid.getCell(input.targetPos);

    if (newCell == null) {
      throw new Error('New cell is null');
    }

    const oldCell = this._grid.getCell(this.worldPos.value);

    if (oldCell == null) {
      throw new Error('Cell is null');
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
