import { call, put, select } from 'redux-saga/effects';

import actions from '../../../actions';
import api from '../../../api';
import ErrorCodes from '../../../constants/ErrorCodes';
import selectors from '../../../selectors';
import { createLocalId } from '../../../utils/local-id';
import request from '../request';

export function* createList(boardId, data) {
  const nextData = {
    ...data,
    position: yield select(selectors.selectNextListPosition, boardId),
  };

  const localId = yield call(createLocalId);

  yield put(
    actions.createList({
      ...nextData,
      boardId,
      id: localId,
    }),
  );

  let list;
  try {
    ({ item: list } = yield call(request, api.createList, boardId, nextData));
  } catch (error) {
    yield put(actions.createList.failure(localId, error));
    return;
  }

  yield put(actions.createList.success(localId, list));
}

export function* createListInCurrentBoard(data) {
  const { boardId } = yield select(selectors.selectPath);

  yield call(createList, boardId, data);
}

export function* handleListCreate(list) {
  yield put(actions.handleListCreate(list));
}

export function* updateList(id, data) {
  yield put(actions.updateList(id, data));

  let list;
  try {
    ({ item: list } = yield call(request, api.updateList, id, data));
  } catch (error) {
    yield put(actions.updateList.failure(id, error));
    return;
  }

  yield put(actions.updateList.success(list));
}

export function* handleListUpdate(list) {
  yield put(actions.handleListUpdate(list));
}

export function* moveList(id, index) {
  const list = yield select(selectors.selectListById, id);
  const { boardId } = list;
  const position = yield select(selectors.selectNextListPosition, boardId, index, id);

  const updateData = {
    position,
  };

  if (list && list.updatedAt) {
    updateData.updatedAt = list.updatedAt instanceof Date ? list.updatedAt.toISOString() : list.updatedAt;
  }

  try {
    yield call(updateList, id, updateData);
  } catch (error) {
    if (error && error.code === ErrorCodes.CONFLICT && boardId) {
      yield put(actions.handleLocationChange.fetchBoard(boardId));
    }
    throw error;
  }
}

export function* deleteList(id) {
  yield put(actions.deleteList(id));

  let list;
  try {
    ({ item: list } = yield call(request, api.deleteList, id));
  } catch (error) {
    yield put(actions.deleteList.failure(id, error));
    return;
  }

  yield put(actions.deleteList.success(list));
}

export function* handleListDelete(list) {
  yield put(actions.handleListDelete(list));
}

export default {
  createList,
  createListInCurrentBoard,
  handleListCreate,
  updateList,
  handleListUpdate,
  moveList,
  deleteList,
  handleListDelete,
};
